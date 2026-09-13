import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import TicketDetailPage from "./pages/TicketDetailPage";
import CreateTicketPage from "./pages/CreateTicketPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tickets/:ticketId" element={<TicketDetailPage />} />
          <Route path="/new" element={<CreateTicketPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}