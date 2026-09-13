from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import tickets, metrics

#initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Datastraw Support CRM API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(metrics.router)
