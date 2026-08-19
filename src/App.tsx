import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getDefaultPathForUser, getToken, getUser, getUserRole } from "@/hooks/useAuth";
import type { AppRole } from "@/hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PassengerDashboard from "./pages/passenger/PassengerDashboard";
import SearchPage from "./pages/passenger/SearchPage";
import SeatSelectionPage from "./pages/passenger/SeatSelectionPage";
import PaymentPage from "./pages/passenger/PaymentPage";
import ProfilePage from "./pages/passenger/ProfilePage";
import ConfirmationPage from "./pages/passenger/ConfirmationPage";
import BookingHistoryPage from "./pages/passenger/BookingHistoryPage";
import MyTickets from "./pages/passenger/MyTicketsPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RouteManagement from "./pages/admin/RouteManagement";
import ScheduleManagement from "./pages/admin/ScheduleManagement";
import BusManagement from "./pages/admin/BusManagement";
import PassengerManagement from "./pages/admin/PassengerManagement";
import AdminManageEmployees from "./pages/AdminManageEmployees";
import ReportsPage from "./pages/admin/ReportsPage";
import NotificationManagement from "./pages/admin/NotificationManagement";
import StaffQRScanPage from "./pages/staff/StaffQRScanPage";
import StaffSeatManagementPage from "./pages/staff/StaffSeatManagementPage";
import NotFound from "./pages/NotFound";
import NotificationsPage from "./pages/passenger/NotificationsPage";

const queryClient = new QueryClient();

const RequireRole = ({ allow, children }: { allow: AppRole[]; children: ReactElement }) => {
  const user = getUser();
  const token = getToken();
  const role = getUserRole(user);

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allow.includes(role)) {
    return <Navigate to={getDefaultPathForUser(user)} replace />;
  }

  return children;
};

const LoginRoute = () => {
  const user = getUser();
  const token = getToken();
  return (user && token) ? <Navigate to={getDefaultPathForUser(user)} replace /> : <LoginPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Passenger */}
          <Route path="/passenger" element={<RequireRole allow={["passenger"]}><PassengerDashboard /></RequireRole>} />
          <Route path="/passenger/search" element={<RequireRole allow={["passenger"]}><SearchPage /></RequireRole>} />
          <Route path="/passenger/seats" element={<RequireRole allow={["passenger", "staff"]}><SeatSelectionPage /></RequireRole>} />
          <Route path="/passenger/payment" element={<RequireRole allow={["passenger"]}><PaymentPage /></RequireRole>} />
          <Route path="/passenger/profile" element={<RequireRole allow={["passenger"]}><ProfilePage /></RequireRole>} />
          <Route path="/passenger/confirmation" element={<RequireRole allow={["passenger"]}><ConfirmationPage /></RequireRole>} />
          <Route path="/passenger/history" element={<RequireRole allow={["passenger"]}><BookingHistoryPage /></RequireRole>} />
          <Route path="/passenger/tickets" element={<RequireRole allow={["passenger"]}><MyTickets /></RequireRole>} />
          <Route path="/passenger/notifications" element={<RequireRole allow={["passenger"]}><NotificationsPage /></RequireRole>} />
          {/* Admin */}
          <Route path="/admin" element={<RequireRole allow={["admin"]}><AdminDashboard /></RequireRole>} />
          <Route path="/admin/routes" element={<RequireRole allow={["admin"]}><RouteManagement /></RequireRole>} />
          <Route path="/admin/schedules" element={<RequireRole allow={["admin"]}><ScheduleManagement /></RequireRole>} />
          <Route path="/admin/buses" element={<RequireRole allow={["admin"]}><BusManagement /></RequireRole>} />
          <Route path="/admin/passengers" element={<RequireRole allow={["admin"]}><PassengerManagement /></RequireRole>} />
          <Route path="/admin/employees" element={<RequireRole allow={["admin"]}><AdminManageEmployees /></RequireRole>} />
          <Route path="/admin/reports" element={<RequireRole allow={["admin"]}><ReportsPage /></RequireRole>} />
          <Route path="/admin/notifications" element={<RequireRole allow={["admin"]}><NotificationManagement /></RequireRole>} />
          {/* Staff */}
          <Route path="/staff" element={<RequireRole allow={["staff"]}><StaffQRScanPage /></RequireRole>} />
          <Route path="/staff/seats" element={<RequireRole allow={["staff"]}><StaffSeatManagementPage /></RequireRole>} />
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
