import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Route, CalendarClock, Bus, Users, UserPlus, BarChart3, Bell, LogOut, Shield } from "lucide-react";
import { getUser, logout } from "@/hooks/useAuth";

const navItems = [
  { label: "แดชบอร์ด", icon: <LayoutDashboard className="w-5 h-5" />, path: "/admin" },
  { label: "จัดการเส้นทาง", icon: <Route className="w-5 h-5" />, path: "/admin/routes" },
  { label: "ตารางเดินรถ", icon: <CalendarClock className="w-5 h-5" />, path: "/admin/schedules" },
  { label: "จัดการรถทัวร์", icon: <Bus className="w-5 h-5" />, path: "/admin/buses" },
  { label: "ข้อมูลผู้โดยสาร", icon: <Users className="w-5 h-5" />, path: "/admin/passengers" },
  { label: "จัดการพนักงาน", icon: <UserPlus className="w-5 h-5" />, path: "/admin/employees" },
  { label: "รายงานสถิติ", icon: <BarChart3 className="w-5 h-5" />, path: "/admin/reports" },
  { label: "แจ้งเตือน", icon: <Bell className="w-5 h-5" />, path: "/admin/notifications" },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "admin") {
      // ถ้าไม่ได้ล็อกอินเป็นแอดมิน ให้ไปหน้าเข้าสู่ระบบ
      navigate("/login");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-9 h-9 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-sm">ระบบจัดการ</p>
            <p className="text-xs opacity-70">ผู้ดูแลระบบ</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button onClick={() => logout("/login")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 w-full">
            <LogOut className="w-5 h-5" />ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
