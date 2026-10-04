import time
from functools import lru_cache
from typing import Any, TypeVar

import httpx
from supabase import Client, create_client

from app.config import settings

T = TypeVar("T")

# Supabase/Cloudflare occasionally drops an idle HTTP/2 connection; httpx's
# pool doesn't always notice before trying to reuse it for the next request,
# surfacing as a RemoteProtocolError on an otherwise-healthy query. Retrying
# once or twice resolves it without any special handling at each call site.
_TRANSIENT_ERRORS = (
    httpx.RemoteProtocolError,
    httpx.ConnectError,
    httpx.ReadError,
    httpx.WriteError,
    httpx.PoolTimeout,
)


@lru_cache
def get_supabase() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_key)


def execute_with_retry(query_builder: Any, max_attempts: int = 3) -> T:
    for attempt in range(max_attempts):
        try:
            return query_builder.execute()
        except _TRANSIENT_ERRORS:
            if attempt == max_attempts - 1:
                raise
            time.sleep(0.5 * (attempt + 1))
