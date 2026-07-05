"""Dashboard analytics and bulk lead import."""
from fastapi import APIRouter, status
from pydantic import BaseModel
from sqlalchemy import func, select

from app.core.deps import CurrentUser, DbSession
from app.models import Lead, LeadStatus
from app.schemas import DashboardStats, LeadCreate, PipelineStat

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(current_user: CurrentUser, db: DbSession) -> DashboardStats:
    rows = db.execute(
        select(
            Lead.status,
            func.count(Lead.id),
            func.coalesce(func.sum(Lead.estimated_value), 0.0),
        )
        .where(Lead.owner_id == current_user.id)
        .group_by(Lead.status)
    ).all()

    counts = {status_: (count, value) for status_, count, value in rows}

    by_status = [
        PipelineStat(
            status=s,
            count=counts.get(s, (0, 0.0))[0],
            total_value=counts.get(s, (0, 0.0))[1],
        )
        for s in LeadStatus
    ]

    total_leads = sum(c for c, _ in counts.values())
    # Pipeline value = everything still in play (not won, not lost).
    open_statuses = {
        LeadStatus.new,
        LeadStatus.contacted,
        LeadStatus.qualified,
        LeadStatus.proposal,
    }
    total_pipeline_value = sum(
        v for s, (_, v) in counts.items() if s in open_statuses
    )
    won_count, won_value = counts.get(LeadStatus.won, (0, 0.0))
    closed = won_count + counts.get(LeadStatus.lost, (0, 0.0))[0]
    conversion_rate = (won_count / closed * 100) if closed else 0.0

    return DashboardStats(
        total_leads=total_leads,
        total_pipeline_value=total_pipeline_value,
        won_value=won_value,
        conversion_rate=round(conversion_rate, 1),
        by_status=by_status,
    )


class BulkImportRequest(BaseModel):
    leads: list[LeadCreate]


class BulkImportResult(BaseModel):
    imported: int


@router.post(
    "/leads/import",
    response_model=BulkImportResult,
    status_code=status.HTTP_201_CREATED,
    tags=["leads"],
)
def bulk_import(
    payload: BulkImportRequest, current_user: CurrentUser, db: DbSession
) -> BulkImportResult:
    """Bulk-create leads, e.g. from a Google Maps scraper export."""
    objects = [
        Lead(owner_id=current_user.id, **lead.model_dump()) for lead in payload.leads
    ]
    db.add_all(objects)
    db.commit()
    return BulkImportResult(imported=len(objects))
