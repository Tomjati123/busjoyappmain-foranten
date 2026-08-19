import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Info, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUser } from "@/hooks/useAuth";
import { getApiBaseUrl } from "@/lib/api";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: "success" | "danger" | "warning" | "info" | string;
  is_read?: boolean;
  isRead?: boolean;
  created_at?: string;
  createdAt?: string;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  const fetchNotifications = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      const res = await fetch(`${apiUrl}/api/users/${user.id}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // หาก API Endpoint ยังไม่มีอยู่ ให้ Fallback เป็น Empty Array เพื่อไม่ให้หน้าพัง
        if (res.status === 404) {
          setNotifications([]);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        throw new Error(data.message || "ไม่สามารถโหลดข้อมูลแจ้งเตือนได้");
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.notifications || [];
      setNotifications(list);
    } catch (err: any) {
      console.error("Fetch notifications error:", err);
      setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันอ่านทั้งหมด
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/users/${user?.id}/notifications/read-all`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
      });

      // อัปเดต UI ทันที
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, isRead: true }))
      );
    } catch (err) {
      console.error("Mark all as read failed:", err);
    }
  };

  // ฟังก์ชันกดอ่านรายการเดียว
  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`${apiUrl}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, isRead: true } : n))
      );
    } catch (err) {
      console.error("Mark as read failed:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ฟังก์ชันเลือก Icon และ Style ตามประเภท
  const getTypeStyles = (type: string) => {
    switch (type?.toLowerCase()) {
      case "success":
        return { 
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, 
          bg: "bg-emerald-500/10 border-emerald-200" 
        };
      case "danger":
      case "error":
        return { 
          icon: <XCircle className="w-5 h-5 text-rose-600" />, 
          bg: "bg-rose-500/10 border-rose-200" 
        };
      case "warning":
        return { 
          icon: <AlertCircle className="w-5 h-5 text-amber-600" />, 
          bg: "bg-amber-500/10 border-amber-200" 
        };
      default:
        return { 
          icon: <Info className="w-5 h-5 text-blue-600" />, 
          bg: "bg-blue-500/10 border-blue-200" 
        };
    }
  };

  const hasUnread = notifications.some((n) => !(n.is_read || n.isRead));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-muted"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              การแจ้งเตือน
            </h1>
          </div>

          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs rounded-xl gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              อ่านทั้งหมดแล้ว
            </Button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <Card>
            <CardContent className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-sm">กำลังโหลดการแจ้งเตือน...</p>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && notifications.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground space-y-2">
              <Bell className="w-12 h-12 mx-auto opacity-20" />
              <p className="font-semibold text-foreground">ไม่มีข้อความแจ้งเตือน</p>
              <p className="text-xs text-muted-foreground">เมื่อมีความเคลื่อนไหวเกี่ยวกับเที่ยวรถ การแจ้งเตือนจะแสดงที่นี่</p>
            </CardContent>
          </Card>
        )}

        {/* Notification List */}
        <div className="space-y-3">
          {!isLoading &&
            !error &&
            notifications.map((notif) => {
              const isRead = notif.is_read || notif.isRead;
              const createdAt = notif.created_at || notif.createdAt;
              const { icon, bg } = getTypeStyles(notif.type);

              return (
                <Card
                  key={notif.id}
                  onClick={() => !isRead && markAsRead(notif.id)}
                  className={`overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-sm ${
                    !isRead
                      ? "border-l-4 border-l-primary bg-card"
                      : "opacity-75 bg-muted/30"
                  }`}
                >
                  <CardContent className="p-4 flex gap-3.5 items-start">
                    <div className={`p-2 rounded-xl border shrink-0 ${bg}`}>
                      {icon}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${!isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                          {notif.title}
                        </p>
                        {createdAt && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                            {new Date(createdAt).toLocaleDateString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed break-words">
                        {notif.message}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;