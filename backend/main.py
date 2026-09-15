from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import tickets, metrics
from logger_middleware import RequestLoggerMiddleware, ENABLED as LOG_ENABLED

#initialize database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Datastraw Support CRM API")

# Optional JSON logger — activated with LOG_ENABLED=1
app.add_middleware(RequestLoggerMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(metrics.router)

if LOG_ENABLED:
    print("📝 Request logging ENABLED → app.log")
