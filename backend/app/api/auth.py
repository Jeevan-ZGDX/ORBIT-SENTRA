from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.models.entities import AppUser, AstronautProfile
from backend.app.schemas.domain import Token, LoginRequest
from backend.app.api.deps import get_current_user, log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    query = select(AppUser).where(AppUser.username == form_data.username)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(subject=str(user.id), role=user.role)
    await log_audit_event(db, action="login_success", entity_type="app_user", entity_id=user.id, actor_id=user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "username": user.username,
        "display_name": user.display_name,
        "role": user.role
    }

@router.get("/me")
async def read_users_me(
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile_id = None
    if current_user.role == "astronaut":
        result = await db.execute(select(AstronautProfile).where(AstronautProfile.user_id == current_user.id))
        prof = result.scalars().first()
        if prof:
            profile_id = str(prof.id)

    return {
        "id": str(current_user.id),
        "username": current_user.username,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "role": current_user.role,
        "astronaut_profile_id": profile_id
    }
