import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket, MapPin, Calendar, Clock, QrCode,
  XCircle, ArrowLeft, Loader2, X, ChevronRight,
  CreditCard, Hash, Bus, CheckCircle2, Ban, History
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser } from "@/hooks/useAuth";
import QRCode from "react-qr-code";
import { getApiBaseUrl } from "@/lib/api";

type Booking = {
  id: number;
  booking_code?: string;
  bookingCode?: string;
  trip_id?: number;
  seat_number?: string;
  seatNumber?: string;
  total_price?: number;
  totalPrice?: number;
  status: string;
  payment_method?: string;
  created_at?: string;
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
  qr_image_url?: string | null;
  qrImageUrl?: string | null;
};

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("active");
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Modal States
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalData, setQrModalData] = useState<{ code: string; qrUrl?: string | null } | null>(null);

  const user = getUser();
  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  const fetchBookings = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    try {
      setIsLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/${user.id}/bookings?status=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "ไม่สามารถดึงข้อมูลตั๋วได้");
        return;
      }
      const bookingList = Array.isArray(data) ? data : data.bookings || [];
      setBookings(bookingList);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId: number) => {
    if (!confirm("ยืนยันการยกเลิกตั๋วใบนี้?")) return;
    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem("token");
      let response = await fetch(`${apiUrl}/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status === 404) {
        response = await fetch(`${apiUrl}/api/bookings/${bookingId}/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      }
      const data = await response.json();
      if (response.ok || data.success) {
        alert("ยกเลิกตั๋วเรียบร้อยแล้ว");
        setSelectedTicket(null);
        fetchBookings();
      } else {
        alert(data.message || data.error || "ยกเลิกไม่สำเร็จ");
      }
    } catch {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [tab]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowQrModal(false);
        setSelectedTicket(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const statusLabel = (status: string) => {
    const s = status?.toLowerCase();
    if (["confirmed", "paid", "booked", "reserved", "ยืนยันแล้ว"].includes(s)) {
      return { text: "ยืนยันแล้ว", cls: "bg-emerald-500/10 text-emerald-600 border border-emerald-200", icon: "✓" };
    }
    if (s === "cancelled" || s === "ยกเลิก") {
      return { text: "ยกเลิกแล้ว", cls: "bg-rose-500/10 text-rose-600 border border-rose-200", icon: "✕" };
    }
    if (s === "completed" || s === "เสร็จสิ้น") {
      return { text: "เดินทางแล้ว", cls: "bg-slate-500/10 text-slate-600 border border-slate-200", icon: "◎" };
    }
    return { text: status || "ไม่ระบุ", cls: "bg-muted text-muted-foreground", icon: "" };
  };

  const formatDate = (rawDate?: string) =>
    rawDate
      ? new Date(rawDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })
      : "-";

  const formatTime = (t?: string) => (t ? t.substring(0, 5) + " น." : "-");

  // InfoBox helper
  const InfoBox = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5 space-y-0.5">
      <p className={`text-[10px] font-medium ${accent || "text-muted-foreground"}`}>{label}</p>
      <p className="font-semibold text-sm text-foreground truncate">{value}</p>
    </div>
  );

  // ============================
  // Ticket Detail Modal
  // ============================
  const TicketModal = ({ booking }: { booking: Booking }) => {
    const code = booking.booking_code || booking.bookingCode || `BK-${booking.id}`;
    const origin = booking.origin || "ต้นทาง";
    const destination = booking.destination || "ปลายทาง";
    const travelDate = formatDate(booking.travel_date || booking.travelDate);
    const depTime = formatTime(booking.departure_time || booking.departureTime);
    const arrTime = formatTime(booking.arrival_time || booking.arrivalTime);
    const seats = booking.seat_number || booking.seatNumber || "-";
    const price = booking.total_price || booking.totalPrice || 0;
    const qrUrl = booking.qr_image_url || booking.qrImageUrl;
    const busType = booking.bus_type || booking.busType || "รถโดยสาร";
    const payMethod = booking.payment_method || "PromptPay";
    const createdAt = booking.created_at
      ? new Date(booking.created_at).toLocaleDateString("th-TH", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : "-";
    const isConfirmed = ["confirmed", "paid", "booked", "reserved", "ยืนยันแล้ว"].includes(
      booking.status?.toLowerCase()
    );
    const { text, cls } = statusLabel(booking.status);

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        onClick={() => setSelectedTicket(null)}
      >
        <div
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden my-4"
          style={{ animation: "modalIn 0.2s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient Header */}
          <div className="relative p-6 text-white" style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)" }}>
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 rounded-full p-1.5 transition-colors"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-1 opacity-75 text-xs font-medium">
              <Ticket className="w-3.5 h-3.5" />
              ตั๋วโดยสาร Bus Joy
            </div>
            <div className="font-mono text-lg font-extrabold tracking-widest">{code}</div>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <span>{origin}</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
              <span>{destination}</span>
            </div>
            <div className={`mt-2 inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>
              {text}
            </div>
          </div>

          {/* Tear line */}
          <div className="relative flex items-center h-0 overflow-visible" style={{ margin: "0 0" }}>
            <div className="absolute -left-3 w-6 h-6 rounded-full" style={{ background: "#f3f4f6" }} />
            <div className="flex-1 border-t-2 border-dashed" style={{ borderColor: "#e5e7eb", marginLeft: "12px", marginRight: "12px" }} />
            <div className="absolute -right-3 w-6 h-6 rounded-full" style={{ background: "#f3f4f6" }} />
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <InfoBox label="📅 วันเดินทาง" value={travelDate} />
              <InfoBox label="🕐 เวลาออก" value={depTime} />
              <InfoBox label="🕑 เวลาถึง" value={arrTime} />
              <InfoBox label="💺 ที่นั่ง" value={seats} />
              <InfoBox label="🚌 ประเภทรถ" value={busType} />
              <InfoBox label="💳 วิธีชำระ" value={payMethod} />
            </div>

            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)" }}>
              <span className="text-sm text-gray-500">ราคารวมทั้งหมด</span>
              <span className="text-xl font-extrabold" style={{ color: "#4f46e5" }}>฿{Number(price).toLocaleString()}</span>
            </div>

            <p className="text-[10px] text-center text-muted-foreground">จองเมื่อ {createdAt}</p>

            {/* QR Section */}
            {isConfirmed && (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="p-3 bg-white rounded-2xl border-2 shadow-md cursor-pointer transition-all duration-200"
                  style={{ borderColor: "#c7d2fe" }}
                  onClick={() => {
                    setQrModalData({ code, qrUrl });
                    setShowQrModal(true);
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,70,229,0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = ""; }}
                >
                  {qrUrl ? (
                    <img src={qrUrl} alt="QR Code" className="w-28 h-28 object-contain" />
                  ) : (
                    <QRCode value={code} size={112} />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <QrCode className="w-3 h-3" style={{ color: "#4f46e5" }} />
                  แตะ QR Code เพื่อขยายให้ใหญ่ขึ้น
                </p>
              </div>
            )}

            {/* Cancel button */}
            {isConfirmed && tab === "active" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 rounded-xl"
                disabled={cancellingId === booking.id}
                onClick={() => handleCancel(booking.id)}
              >
                {cancellingId === booking.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <XCircle className="w-4 h-4 mr-1" />
                )}
                ยกเลิกตั๋ว
              </Button>
            )}
          </div>
        </div>

        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.92) translateY(16px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    );
  };

  // ============================
  // QR Fullscreen Modal
  // ============================
  const QrModal = () => {
    if (!qrModalData) return null;
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-6"
        style={{ backgroundColor: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", animation: "modalIn 0.15s ease-out" }}
        onClick={() => setShowQrModal(false)}
      >
        <div
          className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full"
          style={{ animation: "modalIn 0.2s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="font-bold text-gray-800 text-sm">QR Code ตั๋ว</p>
              <p className="font-mono text-xs text-gray-500">{qrModalData.code}</p>
            </div>
            <button
              onClick={() => setShowQrModal(false)}
              className="bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="p-1 rounded-2xl" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)" }}>
            <div className="bg-white rounded-xl p-4">
              {qrModalData.qrUrl ? (
                <img src={qrModalData.qrUrl} alt="QR Code" className="w-56 h-56 object-contain" />
              ) : (
                <QRCode value={qrModalData.code} size={224} />
              )}
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center">สแกน QR Code นี้เพื่อตรวจสอบตั๋วโดยสาร</p>
        </div>
      </div>
    );
  };

  // ============================
  // MAIN RENDER
  // ============================
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-4xl mx-auto">
      {selectedTicket && <TicketModal booking={selectedTicket} />}
      {showQrModal && <QrModal />}

      {/* Header */}
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
          <Ticket className="w-6 h-6 text-primary" />
          ตั๋วของฉัน
        </h1>
      </div>

      {/* Tabs */}
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

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-sm">กำลังโหลดข้อมูลตั๋ว...</p>
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
      {!isLoading && !error && bookings.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
            <p className="font-medium text-foreground">ยังไม่มีตั๋วการเดินทางในหมวดนี้</p>
            <p className="text-sm text-muted-foreground">เมื่อจองตั๋วสำเร็จ รายการจะแสดงที่นี่</p>
            <Button className="rounded-full mt-2" onClick={() => navigate("/passenger")}>
              ค้นหาเที่ยวรถ
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Booking List */}
      <div className="space-y-4">
        {!isLoading &&
          !error &&
          bookings.map((booking) => {
            const code = booking.booking_code || booking.bookingCode || `BK-${booking.id}`;
            const origin = booking.origin || "ต้นทาง";
            const destination = booking.destination || "ปลายทาง";
            const travelDate = formatDate(booking.travel_date || booking.travelDate);
            const depTime = formatTime(booking.departure_time || booking.departureTime);
            const seats = booking.seat_number || booking.seatNumber || "-";
            const price = booking.total_price || booking.totalPrice || 0;
            const qrUrl = booking.qr_image_url || booking.qrImageUrl;
            const isConfirmed = ["confirmed", "paid", "booked", "reserved", "ยืนยันแล้ว"].includes(
              booking.status?.toLowerCase()
            );
            const { text, cls } = statusLabel(booking.status);

            return (
              <Card
                key={booking.id}
                className="overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group"
                style={{ transform: "translateY(0)", transition: "all 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                onClick={() => setSelectedTicket(booking)}
              >
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Details */}
                    <div className="flex-1 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                          {code}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${cls}`}>
                          {text}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-foreground font-semibold">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          {origin} → {destination}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {travelDate}
                        </div>
                        {depTime && depTime !== "-" && (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {depTime}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div>
                          <p className="text-[11px] text-muted-foreground">ที่นั่ง</p>
                          <p className="font-bold text-foreground text-sm">{seats}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] text-muted-foreground">ราคารวม</p>
                          <p className="font-extrabold text-primary text-base">฿{Number(price).toLocaleString()}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                        <QrCode className="w-3 h-3" />
                        แตะเพื่อดูตั๋วและ QR Code
                        <ChevronRight className="w-3 h-3 ml-auto" />
                      </p>
                    </div>

                    {/* QR Preview */}
                    {isConfirmed && (
                      <div
                        className="border-t md:border-t-0 md:border-l border-dashed border-border p-5 flex flex-col items-center justify-center gap-2 bg-muted/20 min-w-[140px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQrModalData({ code, qrUrl });
                          setShowQrModal(true);
                        }}
                      >
                        <div
                          className="p-2 bg-white rounded-lg border shadow-sm transition-all duration-200"
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                        >
                          {qrUrl ? (
                            <img src={qrUrl} alt="QR Code" className="w-20 h-20 object-contain" />
                          ) : (
                            <QRCode value={code} size={80} />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <QrCode className="w-3 h-3" /> แตะขยาย
                        </p>
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
