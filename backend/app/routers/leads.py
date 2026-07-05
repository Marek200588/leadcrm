"""Lead CRUD routes with filtering, search, pagination, and ownership scoping."""
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select

from app.core.deps import CurrentUser, DbSession
from app.models import Activity, ActivityType, Lead, LeadStatus
from app.schemas import (
    ActivityCreate,
    ActivityPublic,
    LeadCreate,
    LeadDetail,
    LeadList,
    LeadPublic,
    LeadUpdate,
)

router = APIRouter(prefix="/leads", tags=["leads"])


def _get_owned_lead(lead_id: int, user_id: int, db) -> Lead:
    """Fetch a lead, enforcing that it belongs to the current user."""
    lead = db.get(Lead, lead_id)
    if lead is None or lead.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found"
        )
    return lead


@router.get("", response_model=LeadList)
def list_leads(
    current_user: CurrentUser,
    db: DbSession,
    status_filter: Annotated[LeadStatus | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query()] = None,
    sort: Annotated[str, Query()] = "-created_at",
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> LeadList:
    conditions = [Lead.owner_id == current_user.id]
    if status_filter is not None:
        conditions.append(Lead.status == status_filter)
    if search:
        term = f"%{search}%"
        conditions.append(
            or_(
                Lead.company.ilike(term),
                Lead.contact_name.ilike(term),
                Lead.email.ilike(term),
                Lead.category.ilike(term),
            )
        )

    base = select(Lead).where(*conditions)

    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0

    # Whitelist sortable columns; "-" prefix means descending.
    sort_map = {
        "created_at": Lead.created_at,
        "updated_at": Lead.updated_at,
        "score": Lead.score,
        "company": Lead.company,
        "estimated_value": Lead.estimated_value,
    }
    desc = sort.startswith("-")
    key = sort.lstrip("-")
    column = sort_map.get(key, Lead.created_at)
    order = column.desc() if desc else column.asc()

    stmt = (
        base.order_by(order)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = list(db.scalars(stmt).all())

    return LeadList(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=LeadDetail, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, current_user: CurrentUser, db: DbSession) -> Lead:
    lead = Lead(owner_id=current_user.id, **payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadDetail)
def get_lead(lead_id: int, current_user: CurrentUser, db: DbSession) -> Lead:
    return _get_owned_lead(lead_id, current_user.id, db)


@router.patch("/{lead_id}", response_model=LeadDetail)
def update_lead(
    lead_id: int, payload: LeadUpdate, current_user: CurrentUser, db: DbSession
) -> Lead:
    lead = _get_owned_lead(lead_id, current_user.id, db)
    updates = payload.model_dump(exclude_unset=True)

    # Log status changes as activities automatically.
    new_status = updates.get("status")
    if new_status is not None and new_status != lead.status:
        db.add(
            Activity(
                lead_id=lead.id,
                type=ActivityType.status_change,
                content=f"Status changed from {lead.status.value} to {new_status.value}",
            )
        )

    for field, value in updates.items():
        setattr(lead, field, value)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: int, current_user: CurrentUser, db: DbSession) -> None:
    lead = _get_owned_lead(lead_id, current_user.id, db)
    db.delete(lead)
    db.commit()


# --- Activities on a lead ---
@router.post(
    "/{lead_id}/activities",
    response_model=ActivityPublic,
    status_code=status.HTTP_201_CREATED,
)
def add_activity(
    lead_id: int,
    payload: ActivityCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> Activity:
    _get_owned_lead(lead_id, current_user.id, db)
    activity = Activity(lead_id=lead_id, type=payload.type, content=payload.content)
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
