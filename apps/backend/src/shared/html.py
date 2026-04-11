from __future__ import annotations

import re
from urllib.parse import urlparse

import bleach

_SCRIPT_STYLE_BLOCK_RE = re.compile(r"<(script|style)\b[^>]*>.*?</\1>", re.IGNORECASE | re.DOTALL)

_DATA_IMAGE_PREFIXES = (
    "data:image/gif;",
    "data:image/jpeg;",
    "data:image/jpg;",
    "data:image/png;",
    "data:image/webp;",
)

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


def _allowed_attribute(tag: str, name: str, value: str) -> bool:
    if name.startswith("on"):
        return False
    if tag == "a":
        if name == "href":
            return _safe_url(value)
        return name in {"class", "rel", "target", "title"}
    if tag == "img":
        if name == "src":
            return _safe_url(value, allow_data_image=True)
        return name in {"alt", "class", "height", "title", "width"}
    if tag in {"td", "th"}:
        return name in {"class", "colspan", "rowspan"}
    return name in {"class", "title"}


_POST_HTML_CLEANER = bleach.Cleaner(
    tags=_ALLOWED_TAGS,
    attributes=_allowed_attribute,
    protocols=["http", "https", "mailto", "tel", "data"],
    strip=True,
    strip_comments=True,
)


def sanitize_post_html(value: str) -> str:
    without_script_blocks = _SCRIPT_STYLE_BLOCK_RE.sub("", value or "")
    return _POST_HTML_CLEANER.clean(without_script_blocks)
