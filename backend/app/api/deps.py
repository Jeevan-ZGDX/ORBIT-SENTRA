import uuid
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.entities import AppUser, AuditEvent

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> AppUser:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload["sub"]
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=401, detail="Malformed user identity")

    result = await db.execute(select(AppUser).where(AppUser.id == user_uuid))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: AppUser = Depends(get_current_user)) -> AppUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires one of roles: {allowed_roles}. Current role: {current_user.role}"
            )
        return current_user
    return role_checker

async def log_audit_event(
    db: AsyncSession,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID = None,
    actor_id: uuid.UUID = None,
    outcome: str = "success",
    metadata: dict = None
):
    audit = AuditEvent(
        actor_user_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        outcome=outcome,
        metadata_=metadata or {}
    )
    db.add(audit)
    await db.commit()
