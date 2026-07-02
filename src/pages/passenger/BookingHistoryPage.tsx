import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Bus, QrCode, XCircle, Eye, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const statusColor = (status: string) => {
  switch (status) {
    case "confirmed":
    case "ยืนยันแล้ว": return "bg-success/10 text-success";
    case "กำลังเดินทาง": return "bg-primary/10 text-primary";
    case "เสร็จสิ้น": return "bg-muted text-muted-foreground";
    case "cancelled":
    case "ยกเลิก": return "bg-destructive/10 text-destructive";
    default: return "bg-muted text-muted-foreground";
  }
};

const BookingHistoryPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!user.id) return;

        const response = await fetch(
          `http://localhost:5000/api/users/${user.id}/bookings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        console.log("BOOKINGS LOADED:", data);
        setBookings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fetch bookings failed:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user.id) {
      loadBookings();
    } else {
      setLoading(false);
    }
  }, [user.id]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">กำลังโหลดข้อมูลการจอง...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/passenger")}>
              <ArrowLeft className="w-4 h-4 mr-1" />กลับ
            </Button>
          </div>
          <h1 className="font-bold text-foreground">ประวัติการจองและยกเลิก</h1>
          <div className="flex items-center gap-2">
            <Link to="/passenger/profile" className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-border">
              {(user as any)?.picture_url ? (
                <img src={(user as any).picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสการจอง</TableHead>
                  <TableHead>เส้นทาง</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>ที่นั่ง</TableHead>
                  <TableHead>ราคา</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">ไม่พบข้อมูลการจอง</TableCell>
                  </TableRow>
                ) : bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.booking_code}</TableCell>
                    <TableCell>{b.origin} → {b.destination}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(b.travel_date).toLocaleDateString("th-TH")}<br/>
                      <span className="text-xs text-muted-foreground">{b.departure_time?.substring(0, 5)} น.</span>
                    </TableCell>
                    <TableCell>{b.seat_number}</TableCell>
                    <TableCell className="font-medium">฿{Number(b.total_price).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(b.status)}`}>
                        {b.status === "confirmed" ? "ยืนยันแล้ว" : b.status === "cancelled" ? "ยกเลิก" : b.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(b.status === "confirmed" || b.status === "กำลังเดินทาง") && (
                          <Button variant="ghost" size="sm" className="text-primary">
                            <QrCode className="w-4 h-4" />
                          </Button>
                        )}
                        {b.status === "confirmed" && (
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default BookingHistoryPage;
