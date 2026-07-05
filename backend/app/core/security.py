"""Password hashing (Argon2 via pwdlib) and JWT handling (PyJWT)."""
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

# pwdlib with Argon2 is FastAPI's current recommended default (2026),
# replacing the older passlib/bcrypt approach.
password_hash = PasswordHash.recommended()


def hash_password(plain: str) -> str:
    return password_hash.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return password_hash.verify(plain, hashed)


def _create_token(subject: str, token_type: str, expires_delta: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(subject: str) -> str:
    return _create_token(
        subject, "access", timedelta(minutes=settings.access_token_expire_minutes)
    )


def create_refresh_token(subject: str) -> str:
    return _create_token(
        subject, "refresh", timedelta(days=settings.refresh_token_expire_days)
    )


def decode_token(token: str, expected_type: str) -> str:
    """Decode a JWT and return its subject, validating the token type.

    Raises jwt.InvalidTokenError (or subclass) on any problem.
    """
    payload = jwt.decode(
        token, settings.secret_key, algorithms=[settings.algorithm]
    )
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("Wrong token type")
    subject = payload.get("sub")
    if subject is None:
        raise jwt.InvalidTokenError("Missing subject")
    return subject
