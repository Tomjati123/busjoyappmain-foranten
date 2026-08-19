import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, QrCode, XCircle, User, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api";

const statusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
    case "ยืนยันแล้ว": 
    case "paid":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    case "กำลังเดินทาง": 
    case "in_transit":
      return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "เสร็จสิ้น": 
    case "completed":
      return "bg-slate-500/10 text-slate-600 border-slate-200";
    case "cancelled":
    case "ยกเลิก": 
      return "bg-rose-500/10 text-rose-600 border-rose-200";
    default: 
      return "bg-amber-500/10 text-amber-600 border-amber-200";
  }
};

const statusText = (status: string) => {
  switch (status?.toLowerCase()) {
    case "confirmed":
    case "paid":
      return "ยืนยันแล้ว";
    case "in_transit":
      return "กำลังเดินทาง";
    case "completed":
      return "เสร็จสิ้น";
    case "cancelled":
      return "ยกเลิกแล้ว";
    case "pending":
      return "รอการชำระเงิน";
    default:
      return status || "ไม่ระบุ";
  }
};

const BookingHistoryPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | string | null>(null);

  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : {};
  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  const loadBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!user.id) {
        setLoading(false);
        return;
      }

      // ดึงข้อมูลการจองของผู้ใช้
      const response = await fetch(`${apiUrl}/api/bookings/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // หาก endpoint หลักไม่พบ ให้ลอง fallback ไปที่ /api/users/:id/bookings
      let data;
      if (response.ok) {
        data = await response.json();
      } else {
        const fallbackRes = await fetch(`${apiUrl}/api/users/${user.id}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      }

      const bookingList = Array.isArray(data) ? data : data?.bookings || [];
      setBookings(bookingList);
    } catch (error) {
      console.error("Fetch bookings failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.id) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [user.id]);

  // ฟังก์ชันยกเลิกตั๋ว
  const handleCancelBooking = async (bookingId: number | string) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองตั๋วใบนี้?")) return;

    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem("token");

      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("ยกเลิกการจองเรียบร้อยแล้ว");
        loadBookings(); // ดึงข้อมูลใหม่
      } else {
        const data = await response.json();
        alert(data.message || data.error || "ไม่สามารถยกเลิกการจองได้");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/passenger")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
            </Button>
          </div>
          <h1 className="font-bold text-lg text-foreground">ประวัติการจองและยกเลิก</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadBookings} title="รีเฟรชข้อมูล">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Link 
              to="/passenger/profile" 
              className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-border hover:opacity-80"
            >
              {user?.picture_url || user?.avatar ? (
                <img src={user.picture_url || user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <p className="text-sm">กำลังโหลดข้อมูลประวัติการจอง...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัสการจอง</TableHead>
                      <TableHead>เส้นทาง</TableHead>
                      <TableHead>วันที่เดินทาง</TableHead>
                      <TableHead>ที่นั่ง</TableHead>
                      <TableHead>ราคา</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          ไม่พบประวัติการจองตั๋ว
                        </TableCell>
                      </TableRow>
                    ) : (
                      bookings.map((b) => {
                        const bookingCode = b.booking_code || b.bookingCode || `BK-${b.id}`;
                        const origin = b.origin || b.route_origin || b.from_location || "ต้นทาง";
                        const destination = b.destination || b.route_destination || b.to_location || "ปลายทาง";
                        const travelDate = b.travel_date || b.travelDate || b.date;
                        const departureTime = b.departure_time || b.departureTime || "";
                        const seatNumber = b.seat_number || b.seatNumber || b.seats?.join(", ") || "-";
                        const price = b.total_price || b.totalPrice || b.price || 0;
                        const status = b.status || "confirmed";

                        const isConfirmed = status.toLowerCase() === "confirmed" || status.toLowerCase() === "paid" || status === "ยืนยันแล้ว";

                        return (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono font-medium text-xs">
                              {bookingCode}
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {origin} → {destination}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              {travelDate ? new Date(travelDate).toLocaleDateString("th-TH") : "-"}
                              {departureTime && (
                                <span className="block text-[11px] text-muted-foreground">
                                  {departureTime.substring(0, 5)} น.
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{seatNumber}</TableCell>
                            <TableCell className="font-medium text-sm">฿{Number(price).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] font-normal ${statusColor(status)}`}>
                                {statusText(status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isConfirmed && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-primary hover:bg-primary/10"
                                      title="แสดง QR Code ตั๋ว"
                                      onClick={() => navigate(`/passenger/tickets/${b.id}`)}
                                    >
                                      <QrCode className="w-4 h-4" />
                                    </Button>

                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-destructive hover:bg-destructive/10"
                                      title="ยกเลิกการจอง"
                                      disabled={cancellingId === b.id}
                                      onClick={() => handleCancelBooking(b.id)}
                                    >
                                      {cancellingId === b.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <XCircle className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookingHistoryPage;