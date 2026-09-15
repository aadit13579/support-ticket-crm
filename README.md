# Support CRM (SupportDesk)

A modern, fast, and minimalist Support Ticket Customer Relationship Management (CRM) system MVP. This application provides a seamless experience for support agents to manage, track, and resolve customer issues efficiently. 

The project is split into a React-based frontend and a Python FastAPI backend, utilizing SQLite for lightweight, reliable data storage.

## Features

- **Create Tickets**: Captures customer details and issue descriptions while automatically generating a unique ID and timestamp.
- **List All Tickets**: A clean dashboard displaying the ID, customer name, title, status, and creation date for all entries.
- **Search Functionality**: A real-time search bar filtering across customer names, ticket IDs, emails, and descriptions.
- **Filter by Status**: Quick toggle controls to filter the dashboard list strictly by Open, In Progress, or Closed states.
- **View & Update Tickets**: A detailed individual view to read full descriptions, update the ticket status, and append agent notes.
- **Real-Time Dashboard Metrics**: One-view summary cards on the homepage displaying counts for total, open, in-progress, and closed tickets.
- **Visual SLA Warnings**: Automatically flags tickets that have been sitting open for more than 24 hours to prevent support breaches.
- **Quick Close Action**: A 1-click inline button on the dashboard rows to resolve tickets instantly without navigating into the detail view.
- **Bulk Close Orchestration**: Checkbox selections allowing agents to update and close multiple spam or resolved tickets simultaneously via client-side batching.
- **Auto-Status Progression**: A smart workflow automation that automatically transitions an "Open" ticket to "In Progress" the moment an agent adds a note.
- **Customer History Context Panel**: An inline history section querying and displaying prior tickets from the same email to provide instant customer context.
- **1-Click CSV/Excel Export**: Converts the currently filtered dashboard view into a downloadable `.csv` file for management reporting.
- **Environment-Gated JSON Logging**: A structured backend logging system toggled via environment variables for developer debugging (Logs SQL queries and HTTP requests).
- **Dynamic Customer Avatars**: Auto-generates deterministic background colors and initials based on the customer's name using a custom hashing utility.
- **Timezone Synchronization**: A custom UTC-parsing engine ensures timestamps are perfectly synced and displayed in the user's local browser timezone without date-drift.
- **Mobile-Responsive Architecture**: A fully fluid CSS layout featuring a sidebar that gracefully collapses into a top-nav on smaller screens.
- **Race-Condition Guards**: Smart submit handlers utilizing React's `useRef` to track in-flight requests, preventing accidental duplicate API calls.
- **Error Handling**: Built-in loading spinners and error boundary fallbacks (like a "Retry" button) that activate if the backend server goes offline.

## Tech Stack

### Frontend
- **Framework**: React (via Vite)
- **Routing**: React Router DOM
- **Styling**: Pure CSS with Custom Properties (Minimalist design system)

### Backend
- **Framework**: FastAPI
- **Database**: SQLite
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

##  Getting Started

### Prerequisites
- Node.js (v16+)
- Python 3.8+

### 1. Start the Backend (FastAPI)

Navigate to the backend directory, install dependencies, and start the server:

```bash
cd backend
python -m venv venv
# Activate virtual environment (Windows)
.\venv\Scripts\activate
# Activate virtual environment (Mac/Linux)
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### Optional: Enable JSON Logging
To enable detailed request and database logging to `app.log`, start the server with the `LOG_ENABLED` environment variable:
```powershell
# PowerShell
$env:LOG_ENABLED="1"; uvicorn main:app --reload --port 8000
```

### 2. Start the Frontend (React / Vite)

In a new terminal window, navigate to the frontend directory, install dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173` (or the port specified by Vite). The backend API runs on `http://localhost:8000`.
