import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

LOG_ENABLED = os.getenv("LOG_ENABLED", "0") == "1"

# If DATABASE_URL exists in the environment, use it. Otherwise, use local crm.db.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm.db")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=LOG_ENABLED,   # prints raw SQL when logging is on
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Route SQLAlchemy logs into app.log (only when enabled) ──
if LOG_ENABLED:
    import json
    from datetime import datetime, timezone

    sql_logger = logging.getLogger("sqlalchemy.engine")
    sql_logger.setLevel(logging.INFO)
    sql_logger.propagate = False        # keep uvicorn console clean

    fh = logging.FileHandler("app.log", encoding="utf-8")
    fh.setLevel(logging.INFO)

    class SQLJsonFormatter(logging.Formatter):
        """Wraps each SQLAlchemy log line as a JSON object."""
        def format(self, record):
            return json.dumps({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "layer": "sqlalchemy",
                "level": record.levelname,
                "message": record.getMessage(),
            }, default=str, ensure_ascii=False)

    fh.setFormatter(SQLJsonFormatter())
    sql_logger.addHandler(fh)