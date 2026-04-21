#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
from __future__ import annotations

import os
import sys
from pathlib import Path


def default_settings_module() -> str:
    django_env = os.getenv("DJANGO_ENV", "").strip().lower()
    if django_env == "production" or os.getenv("VERCEL"):
        return "config.settings.production"
    return "config.settings.local"


def main() -> None:
    project_root = Path(__file__).resolve().parent
    source_root = project_root / "src"

    if str(source_root) not in sys.path:
        sys.path.insert(0, str(source_root))

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", default_settings_module())

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure the virtual environment is active "
            "and dependencies are installed."
        ) from exc

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
