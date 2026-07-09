from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.auth import require_admin
from app.database import get_db
from app.models import ActivityLog, User
from app.schemas import ActivityLogResponse

router = APIRouter(prefix="/api/activity", tags=["Activity"])


@router.get("/", response_model=list[ActivityLogResponse])
def list_activity(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    logs = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.user))
        .order_by(ActivityLog.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=log.user.full_name,
            action=log.action,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            details=log.details,
            created_at=log.created_at,
        )
        for log in logs
    ]
