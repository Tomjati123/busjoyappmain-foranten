import html2canvas from "html2canvas";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Download, MessageCircle, Mail, MapPin, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QRCode from "react-qr-code";

type BookingDetail = {
  booking_code: string;
  origin: string;
  destination: string;
  travel_date: string;
  departure_time: string;
  arrival_time: string;
  bus_type: string;
  total_price: number;
  seat_number: string;
  qr_image_url: string;
};

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingCode = searchParams.get("bookingCode");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingCode) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5000/api/bookings/${bookingCode}`);
        if (response.ok) {
          const data = await response.json();
          setBooking(data);
        }
      } catch (error) {
        console.error("Load booking error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingCode]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">กำลังดึงข้อมูลการจอง...</div>;
  }

  if (!booking && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold mb-4">ไม่พบข้อมูลการจอง</h1>
        <Button onClick={() => navigate("/passenger")}>กลับสู่หน้าหลัก</Button>
      </div>
    );
  }
    booking?.qr_image_url
booking?.origin
booking?.destination
  const routeLabel = `${booking?.origin} → ${booking?.destination}`;
  const travelDate = booking?.travel_date
    ? new Date(booking.travel_date).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
  const timeLabel = `${booking?.departure_time?.substring(0, 5)} - ${booking?.arrival_time?.substring(0, 5)} น.`;
  const handleDownloadTicket = async () => {
  if (!ticketRef.current) return;

  const canvas = await html2canvas(ticketRef.current);

  const image = canvas.toDataURL("image/png");

  const link = document.createElement("a");
  link.href = image;
  link.download = `ticket-${booking?.booking_code}.png`;
  link.click();
};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">การจองสำเร็จ!</h1>
          <p className="text-muted-foreground mt-1">ขอบคุณที่ใช้บริการ</p>
        </div>

        <div ref={ticketRef}>
  <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 bg-white border rounded-xl flex items-center justify-center mb-3">
          {booking?.qr_image_url ? (
    <img
      src={booking.qr_image_url}
      alt="QR Ticket"
      className="w-48 h-48"
    />
  ) : (
    <p>ไม่พบ QR Code</p>
  )}
</div>
              <p className="text-xs text-muted-foreground font-mono">รหัสการจอง: {booking?.booking_code}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  เส้นทาง
                </span>
                <span className="font-medium text-foreground">{routeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  วันที่
                </span>
                <span className="font-medium text-foreground">{travelDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  เวลา
                </span>
                <span className="font-medium text-foreground">{timeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ที่นั่ง</span>
                <span className="font-medium text-foreground">{booking?.seat_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ประเภทรถ</span>
                <span className="font-medium text-foreground">{booking?.bus_type}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-medium text-foreground">ราคารวม</span>
                <span className="font-bold text-primary text-lg">฿{Number(booking?.total_price).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card> 
</div>

        <div className="space-y-2">
          <Button
  variant="outline"
  className="w-full"
  onClick={handleDownloadTicket}
>
            <Download className="w-4 h-4 mr-2" />
            ดาวน์โหลดตั๋ว
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="text-success border-success/30 hover:bg-success/5">
              <MessageCircle className="w-4 h-4 mr-1" />
              ส่งไป LINE
            </Button>
            <Button variant="outline">
              <Mail className="w-4 h-4 mr-1" />
              ส่งไปอีเมล
            </Button>
          </div>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate("/passenger")}>
            กลับสู่หน้าหลัก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
