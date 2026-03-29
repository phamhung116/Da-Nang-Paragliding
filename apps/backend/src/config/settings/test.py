from .base import *  # noqa: F401,F403

MONGODB_NAME = "paragliding_platform_test"

DATABASES["default"] = parse_uri(  # type: ignore[name-defined]
    "mongodb://127.0.0.1:27017",
    db_name=MONGODB_NAME,
)
