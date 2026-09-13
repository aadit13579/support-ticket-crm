#type validation for how frontend requests are parsed and validated before they hit the backend 
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional
from enum import Enum

class TicketStatus(str, Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    CLOSED = "Closed"

#POST /api/tickets
class TicketCreate(BaseModel):
    customer_name: str
    customer_email: EmailStr
    subject: str
    description: str

#/api/tickets/{ticket_id}
class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    notes: Optional[str] = None

#how a note looks
class NoteOut(BaseModel):
    id: int
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True

#GET /api/tickets (List view)
class TicketListItem(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

#GET /api/tickets/{ticket_id} (Detail view)
class TicketDetail(BaseModel):
    ticket_id: str
    customer_name: str
    customer_email: str
    subject: str
    description: str
    status: str
    created_at: datetime
    notes: List[NoteOut] = []

    class Config:
        from_attributes = True