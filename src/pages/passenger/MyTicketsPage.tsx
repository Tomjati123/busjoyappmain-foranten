import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, MapPin, Calendar, Clock, QrCode, XCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser } from "@/hooks/useAuth";

type Booking = {
  id: number;
  booking_code: string;
  trip_id: number;
  seat_number: string;
  total_price: number;
  status: string;
  payment_method: string;
  created_at: string;
  origin: string;
  destination: string;
  travel_date: string;
  departure_time: string;
  qr_image_url: string | null;
};

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("active"); // "active" = กำลังจะมาถึง, "history" = ประวัติ

  const user = getUser();

  const fetchBookings = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      // ส่งค่า ?status=${tab} ไปให้ API หลังบ้านนำไปกรองข้อมูลในคิวรี SQL
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/bookings?status=${tab}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "ไม่สามารถดึงข้อมูลตั๋วได้");
        return;
      }

      setBookings(data);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm("ยืนยันการยกเลิกตั๋วใบนี้?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        fetchBookings(); // รีโหลดรายการใหม่หลังจากยกเลิกสำเร็จ
      } else {
        alert(data.message || "ยกเลิกไม่สำเร็จ");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  // ทุกครั้งที่เปลี่ยนแท็บ (tab) ฟังก์ชัน fetchBookings จะถูกเรียกใหม่โดยอัตโนมัติ
  useEffect(() => {
    fetchBookings();
  }, [tab]);

  const statusLabel = (status: string) => {
    if (status === "confirmed") return { text: "ยืนยันแล้ว", cls: "bg-success/10 text-success" };
    if (status === "cancelled") return { text: "ยกเลิกแล้ว", cls: "bg-destructive/10 text-destructive" };
    return { text: status, cls: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* ส่วนหัวพร้อมปุ่มย้อนกลับมุมซ้ายบน */}
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-muted" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" />ตั๋วของฉัน
        </h1>
      </div>

      {/* ปุ่มเลือกแท็บ (กำลังจะมาถึง / ประวัติการเดินทาง) */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={tab === "active" ? "default" : "outline"}
          className="rounded-full px-6"
          onClick={() => setTab("active")}
        >
          กำลังจะมาถึง
        </Button>

        <Button
          variant={tab === "history" ? "default" : "outline"}
          className="rounded-full px-6"
          onClick={() => setTab("history")}
        >
          ประวัติการเดินทาง
        </Button>
      </div>

      {isLoading && (
        <Card><CardContent className="p-6 text-center text-muted-foreground">กำลังโหลด...</CardContent></Card>
      )}

      {error && (
        <Card><CardContent className="p-6 text-center text-destructive">{error}</CardContent></Card>
      )}

      {!isLoading && !error && bookings.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="font-medium text-foreground">ยังไม่มีตั๋วการเดินทางในหมวดนี้</p>
            <p className="text-sm text-muted-foreground">เมื่อจองตั๋วสำเร็จ รายการจะแสดงที่นี่</p>
            <Button onClick={() => navigate("/passenger/search")}>ค้นหาเที่ยวรถ</Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {!isLoading && !error && bookings.map((booking) => {
          const { text, cls } = statusLabel(booking.status);
          return (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* ข้อมูลตั๋ว */}
                  <div className="flex-1 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-primary">{booking.booking_code}</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>{text}</span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <MapPin className="w-4 h-4 text-primary" />
                        {booking.origin} → {booking.destination}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {new Date(booking.travel_date).toLocaleDateString("th-TH", {
                          day: "2-digit", month: "short", year: "numeric"
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {booking.departure_time?.substring(0, 5)} น.
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">ที่นั่ง</p>
                        <p className="font-bold text-foreground">{booking.seat_number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">ราคารวม</p>
                        <p className="font-bold text-primary">฿{booking.total_price}</p>
                      </div>
                    </div>

                    {booking.status === "confirmed" && tab === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-destructive border-destructive hover:bg-destructive/10 mt-2"
                        onClick={() => handleCancel(booking.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />ยกเลิกตั๋ว
                      </Button>
                    )}
                  </div>

                  {/* QR Code */}
                  {booking.qr_image_url && booking.status === "confirmed" && (
                    <div className="border-t md:border-t-0 md:border-l border-dashed border-border p-4 flex flex-col items-center justify-center gap-2 bg-muted/30">
                      <QrCode className="w-4 h-4 text-muted-foreground" />
                      <img src={booking.qr_image_url} alt="QR" className="w-28 h-28" />
                      <p className="text-xs text-muted-foreground">สแกนเพื่อตรวจสอบ</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyTicketsPage;