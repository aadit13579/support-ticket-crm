from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter(
    prefix="/api/metrics",
    tags=["Metrics"]
)
"""Returns a count of tickets grouped by status for the dashboard header."""
@router.get("/")
def get_ticket_metrics(db: Session = Depends(get_db)):
    results = db.query(models.Ticket.status, func.count(models.Ticket.id)).group_by(models.Ticket.status).all()
    
    metrics = {"Open": 0, "In Progress": 0, "Closed": 0}
    for status, count in results:
        metrics[status] = count
        
    return metrics