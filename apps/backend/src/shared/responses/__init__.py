from __future__ import annotations

from rest_framework.response import Response


def success(data: object, status_code: int = 200) -> Response:
    return Response({"success": True, "data": data}, status=status_code)


def error(message: str, status_code: int = 400, details: object | None = None) -> Response:
    payload = {"success": False, "message": message}
    if details is not None:
        payload["details"] = details
    return Response(payload, status=status_code)
