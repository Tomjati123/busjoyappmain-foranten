import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ArrowLeft, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUser } from "@/hooks/useAuth";

type Notification = {
  id: number;
  title: string;
  message: string;
  type: "success" | "danger" | "warning" | "info";
  is_read: boolean;
  created_at: string;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      // เรียกหาหลังบ้านดึงรายการแจ้งเตือนของ User คนนี้
      const res = await fetch(`http://localhost:5000/api/users/${user.id}/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "ไม่สามารถโหลดข้อมูลแจ้งเตือนได้");
      
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันกดอ่านแจ้งเตือนทั้งหมด หรือเปลี่ยนสถานะเป็นอ่านแล้ว
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`http://localhost:5000/api/users/${user.id}/notifications/read-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      // อัปเดต UI ให้ทุกตัวเป็น Read ทั้งหมด
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // ฟังก์ชันเลือก Icon และ Style ตามประเภทของการแจ้งเตือน
  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return { icon: <CheckCircle2 className="w-5 h-5 text-success" />, bg: "bg-success/5" };
      case "danger":
        return { icon: <XCircle className="w-5 h-5 text-destructive" />, bg: "bg-destructive/5" };
      case "warning":
        return { icon: <AlertCircle className="w-5 h-5 text-warning" />, bg: "bg-warning/5" };
      default:
        return { icon: <Info className="w-5 h-5 text-blue-500" />, bg: "bg-blue-500/5" };
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* ส่วนหัวพร้อมปุ่มย้อนกลับมุมซ้ายบน */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />การแจ้งเตือน
          </h1>
        </div>
        
        {notifications.some(n => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            อ่านทั้งหมดแล้ว
          </Button>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {isLoading && (
          <Card><CardContent className="p-6 text-center text-muted-foreground">กำลังโหลดแจ้งเตือน...</CardContent></Card>
        )}

        {error && (
          <Card><CardContent className="p-6 text-center text-destructive">{error}</CardContent></Card>
        )}

        {!isLoading && !error && notifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground space-y-2">
              <Bell className="w-12 h-12 mx-auto opacity-20" />
              <p className="font-medium text-foreground">กล่องข้อความว่างเปล่า</p>
              <p className="text-sm">คุณไม่มีข้อความแจ้งเตือนในขณะนี้</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && notifications.map((notif) => {
          const { icon, bg } = getTypeStyles(notif.type);
          return (
            <Card key={notif.id} className={`overflow-hidden transition-colors ${!notif.is_read ? 'border-l-4 border-l-primary font-medium' : 'opacity-80'}`}>
              <CardContent className={`p-4 flex gap-4 items-start ${!notif.is_read ? bg : ''}`}>
                <div className="p-2 rounded-lg bg-background border border-border">
                  {icon}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{notif.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notif.created_at).toLocaleDateString("th-TH", {
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// เคลียร์ตำแหน่งวงเล็บปีกกาและ Export ออกไปเป็นไฟล์หลักให้ React Router ค้นเจอได้เสร็จสมบูรณ์
export default NotificationsPage;