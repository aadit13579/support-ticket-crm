from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, case

from typing import List, Optional
from datetime import date, datetime, time
import models
import schemas
from database import SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

router = APIRouter(
    prefix="/api/tickets",
    tags=["Tickets"]
)

#create ticket api
@router.post("", status_code=201)
def create_ticket(payload: schemas.TicketCreate, db: Session = Depends(get_db)):
    """Creates a new ticket and auto-generates the TKT-XXX ID."""
    new_ticket = models.Ticket(
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        subject=payload.subject,
        description=payload.description,
        status="Open" 
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    new_ticket.ticket_id = f"TKT-{new_ticket.id:03d}" #TKT-001 like
    db.commit()
    db.refresh(new_ticket)
    return {
        "ticket_id": new_ticket.ticket_id,
        "created_at": new_ticket.created_at
    }

@router.get("/customer-history")
def get_customer_history(email: str, current_ticket_id: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Ticket).filter(models.Ticket.customer_email == email)
    
    # Exclude the ticket currently opened on screen
    if current_ticket_id:
        query = query.filter(models.Ticket.ticket_id != current_ticket_id)
        
    count = query.count()
    return {"count": count}

#get tickets list
@router.get("", response_model=List[schemas.TicketListItem])
def list_tickets(
    status: Optional[str] = Query(None, description="Filter by status (Open, In Progress, Closed)"),
    search: Optional[str] = Query(None, description="Search by name, email, ID, or subject"),
    start_date: Optional[date] = Query(None, description="Filter by date raised (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Filter by date raised (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Returns a list of tickets, supporting search, status, and date filters."""
    query = db.query(models.Ticket)
    #status filter
    if status:
        query = query.filter(models.Ticket.status == status)
    #name,email,id,subject filters
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Ticket.customer_name.ilike(search_pattern),
                models.Ticket.customer_email.ilike(search_pattern),
                models.Ticket.ticket_id.ilike(search_pattern),
                models.Ticket.subject.ilike(search_pattern),
            )
        )
    #date filter -start
    if start_date:
        start_datetime = datetime.combine(start_date, time.min)
        query = query.filter(models.Ticket.created_at >= start_datetime)
    #date filter - end
    if end_date:
        end_datetime = datetime.combine(end_date, time.max)
        query = query.filter(models.Ticket.created_at <= end_datetime)
    
    if status == "Closed":
        return query.order_by(models.Ticket.created_at.desc()).all()

    if status == "Closed":
        return query.order_by(models.Ticket.created_at.desc()).all()

    # Define strict priority: 1. Open, 2. In Progress, 3. Closed
    status_order = case(
        (models.Ticket.status == "Open", 1),
        (models.Ticket.status == "In Progress", 2),
        (models.Ticket.status == "Closed", 3),
        else_=4
    )
    return query.order_by(status_order, models.Ticket.created_at.asc()).all()

#detailed ticket view
@router.get("/{ticket_id}", response_model=schemas.TicketDetail)
def get_ticket_detail(ticket_id: str, db: Session = Depends(get_db)):
    """Returns all details for a specific ticket, including its notes."""
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Because schemas.TicketDetail includes `notes: List[NoteOut]`,
    # and models.py has `notes = relationship(...)`, FastAPI automatically 
    # fetches and embeds all notes related to this ticket in the JSON response.
    return ticket


@router.put("/{ticket_id}")
def update_ticket(ticket_id: str, payload: schemas.TicketUpdate, db: Session = Depends(get_db)):
    """Updates the ticket status and/or adds a new internal note."""
    ticket = db.query(models.Ticket).filter(models.Ticket.ticket_id == ticket_id).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Update status if provided in the payload
    if payload.status:
        ticket.status = payload.status.value
        ticket.updated_at = datetime.utcnow()

    # Create a new note if text is provided in the payload
    if payload.notes and payload.notes.strip():
        new_note = models.Note(
            ticket_id=ticket.id, 
            note_text=payload.notes.strip()
        )
        db.add(new_note)
        
    if payload.notes and ticket.status == "Open" and not payload.status:
        ticket.status = "In Progress"
    db.commit()
    
    return {
        "success": True, 
        "updated_at": ticket.updated_at
    }
    