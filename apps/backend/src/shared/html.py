from __future__ import annotations

import html
import re
from urllib.parse import urlparse

import bleach

_SCRIPT_STYLE_BLOCK_RE = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)
_STYLE_ATTRIBUTE_RE = re.compile(r"""\sstyle\s*=\s*(?P<quote>["'])(?P<value>.*?)(?P=quote)""", re.IGNORECASE | re.DOTALL)

_DATA_IMAGE_PREFIXES = (
    "data:image/gif;",
    "data:image/jpeg;",
    "data:image/jpg;",
    "data:image/png;",
    "data:image/webp;",
)

_SAFE_STYLE_ATTRIBUTE = "data-safe-style"
_ALLOWED_ALIGNMENT_VALUES = {"left", "center", "right", "justify"}
_ALLOWED_DISPLAY_VALUES = {"block", "inline", "inline-block", "table", "table-caption"}
_ALLOWED_FLOAT_VALUES = {"left", "right", "none"}
_ALLOWED_FONT_STYLE_VALUES = {"normal", "italic", "oblique"}
_ALLOWED_FONT_WEIGHT_VALUES = {"normal", "bold", "bolder", "lighter"}
_ALLOWED_LIST_STYLE_VALUES = {"disc", "circle", "square", "decimal", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman", "none"}
_ALLOWED_TEXT_DECORATION_VALUES = {"none", "underline", "line-through", "overline", "underline line-through", "line-through underline"}
_LENGTH_VALUE_RE = re.compile(r"^(?:0|auto|\d+(?:\.\d+)?(?:px|em|rem|%)?)$", re.IGNORECASE)
_COLOR_VALUE_RE = re.compile(
    r"^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla)\([\d\s.,/%+-]+\)|[a-z-]+)$",
    re.IGNORECASE,
)
_FONT_FAMILY_VALUE_RE = re.compile(r"^[a-z0-9,'\"\-\s]+$", re.IGNORECASE)

_ALLOWED_TAGS = [
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
]


def _safe_url(value: str, *, allow_data_image: bool = False) -> bool:
    normalized = value.strip()
    if not normalized:
        return False
    if normalized.startswith(("#", "/")):
        return True
    lower_value = normalized.lower()
    if allow_data_image and lower_value.startswith(_DATA_IMAGE_PREFIXES) and ";base64," in lower_value[:120]:
        return True
    scheme = urlparse(normalized).scheme.lower()
    return scheme in {"http", "https", "mailto", "tel"}


def _normalize_whitespace(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _is_safe_css_value(property_name: str, value: str) -> bool:
    normalized = _normalize_whitespace(value)
    lowered = normalized.lower()

    if not lowered:
        return False

    if any(token in lowered for token in ("expression", "javascript:", "@import", "url(", "behavior", "<", ">", "{", "}")):
        return False

    if property_name == "text-align":
        return lowered in _ALLOWED_ALIGNMENT_VALUES

    if property_name in {"margin-left", "margin-right", "width", "height", "max-width", "padding-left"}:
        return bool(_LENGTH_VALUE_RE.fullmatch(lowered))

    if property_name in {"color", "background-color"}:
        return bool(_COLOR_VALUE_RE.fullmatch(lowered))

    if property_name == "font-size":
        return lowered != "auto" and bool(_LENGTH_VALUE_RE.fullmatch(lowered))

    if property_name == "font-family":
        return bool(_FONT_FAMILY_VALUE_RE.fullmatch(normalized))

    if property_name == "font-weight":
        return lowered in _ALLOWED_FONT_WEIGHT_VALUES or bool(re.fullmatch(r"[1-9]00", lowered))

    if property_name == "font-style":
        return lowered in _ALLOWED_FONT_STYLE_VALUES

    if property_name == "text-decoration":
        return lowered in _ALLOWED_TEXT_DECORATION_VALUES

    if property_name == "float":
        return lowered in _ALLOWED_FLOAT_VALUES

    if property_name == "display":
        return lowered in _ALLOWED_DISPLAY_VALUES

    if property_name == "list-style-type":
        return lowered in _ALLOWED_LIST_STYLE_VALUES

    return False


def _sanitize_inline_style(value: str) -> str:
    safe_declarations: dict[str, str] = {}

    for declaration in value.split(";"):
        if ":" not in declaration:
            continue
        property_name, raw_value = declaration.split(":", 1)
        normalized_name = property_name.strip().lower()
        normalized_value = _normalize_whitespace(raw_value)

        if _is_safe_css_value(normalized_name, normalized_value):
            safe_declarations[normalized_name] = normalized_value

    return "; ".join(f"{property_name}: {property_value}" for property_name, property_value in safe_declarations.items())


def _protect_safe_style_attributes(value: str) -> str:
    def replace(match: re.Match[str]) -> str:
        safe_style = _sanitize_inline_style(match.group("value"))
        if not safe_style:
            return ""
        return f' {_SAFE_STYLE_ATTRIBUTE}="{html.escape(safe_style, quote=True)}"'

    return _STYLE_ATTRIBUTE_RE.sub(replace, value)


def _allowed_attribute(tag: str, name: str, value: str) -> bool:
    if name.startswith("on"):
        return False

    if name == _SAFE_STYLE_ATTRIBUTE:
        return True

    if name == "align":
        return value.strip().lower() in _ALLOWED_ALIGNMENT_VALUES

    if tag == "a":
        if name == "href":
            return _safe_url(value)
        return name in {"class", "rel", "target", "title"}

    if tag == "img":
        if name == "src":
            return _safe_url(value, allow_data_image=True)
        return name in {"alt", "class", "height", "title", "width", "align"}

    if tag in {"td", "th"}:
        return name in {"class", "colspan", "rowspan", "align", "title"}

    return name in {"class", "title", "align"}


_POST_HTML_CLEANER = bleach.Cleaner(
    tags=_ALLOWED_TAGS,
    attributes=_allowed_attribute,
    protocols=["http", "https", "mailto", "tel", "data"],
    strip=True,
    strip_comments=True,
)


def sanitize_post_html(value: str) -> str:
    without_script_blocks = _SCRIPT_STYLE_BLOCK_RE.sub("", value or "")
    with_safe_styles = _protect_safe_style_attributes(without_script_blocks)
    cleaned = _POST_HTML_CLEANER.clean(with_safe_styles)
    return cleaned.replace(_SAFE_STYLE_ATTRIBUTE, "style")
