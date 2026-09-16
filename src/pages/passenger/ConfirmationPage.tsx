import html2canvas from "html2canvas";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle, Download,
  MapPin, Calendar, Clock, Loader2, Home, AlertCircle, Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { getApiBaseUrl } from "@/lib/api";

type BookingDetail = {
  id?: number;
  booking_code?: string;
  bookingCode?: string;
  origin?: string;
  destination?: string;
  travel_date?: string;
  travelDate?: string;
  departure_time?: string;
  departureTime?: string;
  arrival_time?: string;
  arrivalTime?: string;
  bus_type?: string;
  busType?: string;
  total_price?: number;
  totalPrice?: number;
  seat_number?: string;
  seatNumber?: string;
  status?: string;
  payment_method?: string;
  qr_image_url?: string;
  qrImageUrl?: string;
};

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingCode = searchParams.get("bookingCode") || searchParams.get("code");
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingCode) {
        setLoadError("ไม่พบรหัสการจอง");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${apiUrl}/api/bookings/${bookingCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setBooking(data.booking || data);
        } else {
          const errData = await response.json().catch(() => ({}));
          setLoadError(errData.message || `ไม่พบข้อมูลการจอง (${response.status})`);
        }
      } catch (error) {
        console.error("Load booking error:", error);
        setLoadError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ");
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingCode, apiUrl]);

  useEffect(() => {
    if (!booking || !bookingCode || !ticketRef.current) return;
    let cancelled = false;
    const sendTicketImage = async () => {
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 250));
        if (cancelled || !ticketRef.current) return;
        const canvas = await html2canvas(ticketRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        const token = localStorage.getItem("token");
        await fetch(`${apiUrl}/api/bookings/${encodeURIComponent(bookingCode)}/ticket-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image: canvas.toDataURL("image/png") }),
        });
      } catch (error) {
        console.error("Automatic LINE ticket image error:", error);
      }
    };
    sendTicketImage();
    return () => { cancelled = true; };
  }, [booking, bookingCode, apiUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">กำลังดึงข้อมูลการจอง...</p>
      </div>
    );
  }

  if (loadError || !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold mb-2">ไม่พบข้อมูลการจอง</h1>
        <p className="text-sm text-muted-foreground mb-1">{loadError || "รหัสการจองอาจไม่ถูกต้อง"}</p>
        {bookingCode && (
          <p className="text-xs text-muted-foreground font-mono mb-6 bg-muted px-3 py-1 rounded">
            รหัสที่ค้นหา: {bookingCode}
          </p>
        )}
        <div className="flex gap-2">
          <Button onClick={() => navigate("/passenger/tickets")} variant="default">
            <Ticket className="w-4 h-4 mr-2" />
            ดูตั๋วของฉัน
          </Button>
          <Button onClick={() => navigate("/passenger")} variant="outline">
            <Home className="w-4 h-4 mr-2" />
            หน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  // ดึงค่า Field รองรับทั้ง snake_case และ camelCase
  const code = booking?.booking_code || booking?.bookingCode || bookingCode || "N/A";
  const origin = booking?.origin || "ต้นทาง";
  const destination = booking?.destination || "ปลายทาง";
  const routeLabel = `${origin} → ${destination}`;

  const rawDate = booking?.travel_date || booking?.travelDate;
  const travelDate = rawDate
    ? new Date(rawDate).toLocaleDateString("th-TH", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "-";

  const depTime = (booking?.departure_time || booking?.departureTime || "").substring(0, 5);
  const arrTime = (booking?.arrival_time || booking?.arrivalTime || "").substring(0, 5);
  const timeLabel = depTime ? `${depTime} ${arrTime ? `- ${arrTime}` : ""} น.` : "-";

  const seats = booking?.seat_number || booking?.seatNumber || "-";
  const busType = booking?.bus_type || booking?.busType || "รถทัวร์ปรับอากาศ";
  const price = booking?.total_price || booking?.totalPrice || 0;
  const payMethod = booking?.payment_method || "PromptPay";
  const qrUrl = booking?.qr_image_url || booking?.qrImageUrl;

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      setIsDownloading(true);
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `ticket-${code}.png`;
      link.click();
    } catch (error) {
      console.error("Download ticket error:", error);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลดตั๋ว");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Banner แสดงความสำเร็จ */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">การจองสำเร็จ!</h1>
          <p className="text-xs text-muted-foreground mt-1">ขอบคุณที่เลือกใช้บริการ Bus Joy</p>
        </div>

        {/* ตั๋ว */}
        <div ref={ticketRef} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-4">
          {/* Gradient header */}
          <div
            className="p-5 text-white"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-75 mb-0.5">ตั๋วโดยสาร Bus Joy</p>
                <p className="font-mono text-lg font-extrabold tracking-widest">{code}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-75">ราคา</p>
                <p className="text-xl font-black">฿{Number(price).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
              <span>{origin}</span>
              <span className="opacity-70">→</span>
              <span>{destination}</span>
            </div>
          </div>

          {/* Tear line */}
          <div className="relative flex items-center">
            <div className="absolute -left-3 w-6 h-6 rounded-full bg-background" />
            <div className="flex-1 border-t-2 border-dashed border-border mx-3" />
            <div className="absolute -right-3 w-6 h-6 rounded-full bg-background" />
          </div>

          <Card className="border-0 shadow-none">
            <CardContent className="p-5">
              {/* QR Code Section */}
              <div className="flex flex-col items-center text-center mb-5 pb-5 border-b border-dashed border-border">
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Ticket" className="w-44 h-44 object-contain" />
                  ) : (
                    <QRCode value={code} size={176} />
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono bg-muted/60 px-3 py-1 rounded-full">
                  รหัสการจอง: <span className="font-bold text-foreground">{code}</span>
                </p>
              </div>

              {/* รายละเอียดเที่ยวรถ */}
              <div className="space-y-2.5 text-sm">
                <Row label={<><MapPin className="w-3.5 h-3.5 text-primary" /> เส้นทาง</>} value={routeLabel} />
                <Row label={<><Calendar className="w-3.5 h-3.5 text-primary" /> วันที่เดินทาง</>} value={travelDate} />
                <Row label={<><Clock className="w-3.5 h-3.5 text-primary" /> เวลา</>} value={timeLabel} />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-xs">เลขที่นั่ง</span>
                  <span className="font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                    {seats}
                  </span>
                </div>
                <Row label="ประเภทรถ" value={busType} />
                <Row label="วิธีชำระเงิน" value={payMethod} />

                <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                  <span className="font-medium text-foreground text-xs">ราคารวมทั้งสิ้น</span>
                  <span className="font-extrabold text-primary text-xl">
                    ฿{Number(price).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ปุ่มจัดการ */}
        <div className="space-y-2">
          <Button
            variant="default"
            className="w-full rounded-xl gap-2"
            onClick={handleDownloadTicket}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            ดาวน์โหลดตั๋ว (PNG)
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-xl gap-2"
            onClick={() => navigate("/passenger/tickets")}
          >
            <Ticket className="w-4 h-4" />
            ดูตั๋วทั้งหมดของฉัน
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground rounded-xl gap-1"
            onClick={() => navigate("/passenger")}
          >
            <Home className="w-4 h-4" /> กลับสู่หน้าหลัก
          </Button>
        </div>
      </div>
    </div>
  );
};

// Helper component
const Row = ({ label, value }: { label: React.ReactNode; value: string }) => (
  <div className="flex justify-between items-center">
    <span className="text-muted-foreground text-xs flex items-center gap-1.5">{label}</span>
    <span className="font-medium text-foreground text-sm">{value}</span>
  </div>
);

export default ConfirmationPage;
