import redis
import json
from typing import Any, Optional
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_redis() -> redis.Redis:
    return redis_client


def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    try:
        redis_client.set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except redis.RedisError:
        pass


def cache_get(key: str) -> Optional[Any]:
    try:
        value = redis_client.get(key)
        return json.loads(value) if value else None
    except redis.RedisError:
        return None


def cache_delete(key: str) -> None:
    try:
        redis_client.delete(key)
    except redis.RedisError:
        pass


def cache_delete_pattern(pattern: str) -> None:
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
    except redis.RedisError:
        pass


def is_redis_available() -> bool:
    try:
        redis_client.ping()
        return True
    except redis.RedisError:
        return False