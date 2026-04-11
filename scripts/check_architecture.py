from __future__ import annotations

import ast
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND_MODULES = ROOT / "apps" / "backend" / "src" / "modules"
FRONTEND_APPS = [
    ROOT / "apps" / "customer-web" / "src",
    ROOT / "apps" / "admin-web" / "src",
    ROOT / "apps" / "pilot-web" / "src",
]

PYTHON_IGNORED_DIRS = {"migrations", "management", "__pycache__"}
DJANGO_IMPORTS = ("django", "rest_framework", "django_mongodb_backend")
BACKEND_LAYER_FORBIDDEN = {
    "domain": (
        "django",
        "rest_framework",
        "django_mongodb_backend",
        "modules.*.application",
        "modules.*.infrastructure",
        "modules.*.presentation",
        "modules.*.models",
    ),
    "application": (
        "django",
        "rest_framework",
        "django_mongodb_backend",
        "modules.*.infrastructure",
        "modules.*.presentation",
        "modules.*.models",
    ),
    "infrastructure": ("modules.*.presentation",),
}

FRONTEND_LAYER_RANK = {
    "shared": 1,
    "entities": 2,
    "features": 3,
    "widgets": 4,
    "pages": 5,
    "app": 6,
}

TS_IMPORT_PATTERN = re.compile(
    r"""(?:from\s+["']([^"']+)["'])|(?:import\s*\(\s*["']([^"']+)["']\s*\))"""
)


def _module_matches(module_name: str, pattern: str) -> bool:
    if "*" not in pattern:
        return module_name == pattern or module_name.startswith(f"{pattern}.")

    pattern_parts = pattern.split(".")
    module_parts = module_name.split(".")
    if len(module_parts) < len(pattern_parts):
        return False

    return all(pattern_part == "*" or pattern_part == module_part for pattern_part, module_part in zip(pattern_parts, module_parts))


def _imported_modules(tree: ast.AST) -> list[str]:
    modules: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.append(node.module)
    return modules


def _backend_layer(path: Path) -> str | None:
    parts = path.relative_to(BACKEND_MODULES).parts
    for layer in BACKEND_LAYER_FORBIDDEN:
        if layer in parts:
            return layer
    return None


def check_backend() -> list[str]:
    violations: list[str] = []
    for path in BACKEND_MODULES.rglob("*.py"):
        if any(part in PYTHON_IGNORED_DIRS for part in path.parts):
            continue
        layer = _backend_layer(path)
        if not layer:
            continue

        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except SyntaxError as exc:
            violations.append(f"{path.relative_to(ROOT)}: syntax error: {exc}")
            continue

        for module_name in _imported_modules(tree):
            for forbidden in BACKEND_LAYER_FORBIDDEN[layer]:
                if _module_matches(module_name, forbidden):
                    violations.append(
                        f"{path.relative_to(ROOT)}: {layer} layer must not import `{module_name}`"
                    )
                    break
    return violations


def _frontend_layer(path: Path, app_src: Path) -> str | None:
    try:
        first_part = path.relative_to(app_src).parts[0]
    except ValueError:
        return None
    return first_part if first_part in FRONTEND_LAYER_RANK else None


def _frontend_import_layer(import_path: str) -> str | None:
    if not import_path.startswith("@/"):
        return None
    candidate = import_path[2:].split("/", 1)[0]
    return candidate if candidate in FRONTEND_LAYER_RANK else None


def check_frontend() -> list[str]:
    violations: list[str] = []
    for app_src in FRONTEND_APPS:
        if not app_src.exists():
            continue
        for path in app_src.rglob("*"):
            if path.suffix not in {".ts", ".tsx"}:
                continue
            layer = _frontend_layer(path, app_src)
            if not layer:
                continue
            source = path.read_text(encoding="utf-8")
            for match in TS_IMPORT_PATTERN.finditer(source):
                import_path = next(group for group in match.groups() if group)
                imported_layer = _frontend_import_layer(import_path)
                if not imported_layer:
                    continue
                if FRONTEND_LAYER_RANK[imported_layer] > FRONTEND_LAYER_RANK[layer]:
                    violations.append(
                        f"{path.relative_to(ROOT)}: `{layer}` must not import higher layer `{imported_layer}` via `{import_path}`"
                    )
    return violations


def main() -> int:
    violations = check_backend() + check_frontend()
    if violations:
        print("Architecture boundary violations found:")
        for violation in violations:
            print(f"- {violation}")
        return 1

    print("Architecture boundaries OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
