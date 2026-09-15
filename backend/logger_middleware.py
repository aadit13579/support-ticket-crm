"""
Optional JSON logger middleware.
Activated only when env var LOG_ENABLED=1.

Usage:
  $env:LOG_ENABLED="1"; uvicorn main:app --reload --port 8000   # PowerShell
  LOG_ENABLED=1 uvicorn main:app --reload --port 8000            # bash
"""

import os
import json
import time
import logging
from datetime import datetime, timezone
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

ENABLED = os.getenv("LOG_ENABLED", "0") == "1"

# ── Setup file logger (only if enabled) ─────────────────────
_logger = None

def _get_logger():
    global _logger
    if _logger:
        return _logger
    _logger = logging.getLogger("app_json")
    _logger.setLevel(logging.INFO)
    _logger.propagate = False          # don't spam uvicorn console

    fh = logging.FileHandler("app.log", encoding="utf-8")
    fh.setLevel(logging.INFO)
    fh.setFormatter(logging.Formatter("%(message)s"))   # raw JSON per line
    _logger.addHandler(fh)
    return _logger


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """Logs every request/response as a single JSON line to app.log."""

    async def dispatch(self, request: Request, call_next):
        if not ENABLED:
            return await call_next(request)

        logger = _get_logger()
        start  = time.perf_counter()

        # ── Capture request body (only for write methods) ────
        req_body = None
        if request.method in ("POST", "PUT", "PATCH"):
            try:
                raw = await request.body()
                req_body = json.loads(raw) if raw else None
            except Exception:
                req_body = raw.decode("utf-8", errors="replace") if raw else None

        # ── Execute the actual endpoint ──────────────────────
        error_msg = None
        status_code = 500
        res_body = None

        try:
            response = await call_next(request)
            status_code = response.status_code

            # Read response body (stream → bytes → re-wrap)
            body_chunks = []
            async for chunk in response.body_iterator:
                body_chunks.append(chunk if isinstance(chunk, bytes) else chunk.encode())
            body_bytes = b"".join(body_chunks)

            try:
                res_body = json.loads(body_bytes)
            except Exception:
                res_body = body_bytes.decode("utf-8", errors="replace")[:500]

            # Re-wrap so the client still gets the response
            from starlette.responses import Response
            response = Response(
                content=body_bytes,
                status_code=status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
        except Exception as exc:
            error_msg = str(exc)
            raise
        finally:
            elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "method":    request.method,
                "path":      str(request.url.path),
                "query":     str(request.url.query) or None,
                "status":    status_code,
                "ms":        elapsed_ms,
            }

            if req_body is not None:
                entry["input"] = req_body
            if res_body is not None:
                entry["output"] = res_body
            if error_msg:
                entry["error"] = error_msg

            logger.info(json.dumps(entry, default=str, ensure_ascii=False))

        return response
