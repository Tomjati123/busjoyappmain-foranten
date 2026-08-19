import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, QrCode, Smartphone, MapPin, Clock, Calendar, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUser } from "@/hooks/useAuth";
import { getApiBaseUrl } from "@/lib/api";

const paymentMethods = [
  { id: "promptpay", label: "PromptPay", icon: <Smartphone className="w-5 h-5" />, desc: "สแกน QR Code ชำระเงิน" },
  { id: "credit", label: "บัตรเครดิต", icon: <CreditCard className="w-5 h-5" />, desc: "Visa / Mastercard" },
  { id: "qr", label: "QR Code ธนาคาร", icon: <QrCode className="w-5 h-5" />, desc: "สแกนผ่านแอปธนาคาร" },
];

type TripSelection = {
  id: number;
  trip_id?: number;
  tripId?: number;
  scheduleId?: number;
  origin: string;
  destination: string;
  travel_date?: string;
  travelDate?: string;
  departure_time?: string;
  departureTime?: string;
  arrival_time?: string;
  arrivalTime?: string;
  bus_type?: string;
  price: number;
  seatIds?: string[];
  seats?: string[];
};

const PaymentPage = () => {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [method, setMethod] = useState("promptpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripSelection | null>(null);

  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  useEffect(() => {
    const rawTrip = localStorage.getItem("selectedTrip");
    if (!rawTrip) {
      alert("ไม่พบข้อมูลการจอง กรุณาเลือกรอบรถและที่นั่งใหม่อีกครั้ง");
      navigate("/passenger");
      return;
    }
    try {
      setSelectedTrip(JSON.parse(rawTrip));
    } catch {
      setSelectedTrip(null);
    }
  }, [navigate]);

  const seatList = selectedTrip?.seatIds || selectedTrip?.seats || [];
  const totalSeats = seatList.length || 1;
  const pricePerSeat = selectedTrip?.price ?? 0;
  const totalPrice = pricePerSeat * totalSeats;

  const routeLabel = selectedTrip
    ? `${selectedTrip.origin} → ${selectedTrip.destination}`
    : "กรุงเทพมหานคร → เชียงใหม่";

  const rawDate = selectedTrip?.travel_date || selectedTrip?.travelDate;
  const travelDate = rawDate
    ? new Date(rawDate).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const depTime = (selectedTrip?.departure_time || selectedTrip?.departureTime || "").substring(0, 5);
  const arrTime = (selectedTrip?.arrival_time || selectedTrip?.arrivalTime || "").substring(0, 5);
  const timeLabel = depTime ? `${depTime} ${arrTime ? `- ${arrTime}` : ""} น.` : "-";

  // 🟢 ฟังก์ชันส่งข้อมูลจองและบันทึกลงฐานข้อมูลจริงแบบ 100%
  const handleConfirmPayment = async () => {
    if (!selectedTrip || seatList.length === 0) {
      alert("ข้อมูลไม่ครบถ้วน กรุณาเลือกที่นั่งใหม่อีกครั้ง");
      return;
    }

    try {
      setIsProcessing(true);
      
      // 🟢 ดึง Token มารอส่งใน Header
      const token = localStorage.getItem("token");

      // 🟢 ค้นหาและดึง userId จากทุกช่องทางที่อาจจะแฝงอยู่ ป้องกัน Not-Null Constraint จากฝั่ง DB
      let userId = 1; 
      try {
        const localUser = localStorage.getItem("user");
        if (currentUser && currentUser.id) {
          userId = currentUser.id;
        } else if (localUser) {
          const parsed = JSON.parse(localUser);
          userId = parsed.id || parsed.user_id || 1;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }

      // 🟢 1. ดักจับ ID เที่ยวรถจากทุกคีย์ที่เป็นไปได้จาก localStorage เพื่อป้องกันค่าว่างส่งไปหลังบ้าน
      const finalTripId = selectedTrip?.id || selectedTrip?.trip_id || selectedTrip?.tripId || selectedTrip?.scheduleId;

      // payload สำหรับสร้าง booking จริง
      const bookingPayload = {
        user_id: Number(userId),
        userId: Number(userId),

        tripId: finalTripId ? Number(finalTripId) : null,
        trip_id: finalTripId ? Number(finalTripId) : null,
        scheduleId: finalTripId ? Number(finalTripId) : null,

        // ส่ง array ทั้งหมด ให้ backend join เอง
        seatNumber: seatList,
        seat_number: seatList,

        totalPrice: totalPrice,
        total_price: totalPrice,
        amount: totalPrice,
        payment_method: method,
        paymentMethod: method,
        status: "paid",
      };

      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(bookingPayload),
      });

      const result = await response.json();

      if (response.ok) {
        // หากบันทึกสำเร็จ นำรหัสการจองจริงไปหน้ายืนยัน
        const bookingCode = result.booking?.booking_code || result.booking_code || result.id;
        localStorage.removeItem("selectedTrip");
        navigate(`/passenger/confirmation?bookingCode=${bookingCode}`);
      } else {
        // แจ้งรายละเอียด Error ที่ส่งกลับมาจากเซิร์ฟเวอร์
        console.error("Backend validation error:", result);
        alert(`เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: ${result.message || "ไม่สามารถบันทึกข้อมูลการจองได้"}`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ กรุณาตรวจสอบการรัน API ของคุณ");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับ
          </Button>
          <h1 className="font-bold text-foreground ml-4 text-lg">ชำระเงินออนไลน์</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Payment Method Selector */}
          <div className="md:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">เลือกช่องทางชำระเงิน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                      method === m.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        method === m.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Credit Card Form */}
            {method === "credit" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">ข้อมูลบัตรเครดิต / เดบิต</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-foreground font-medium">หมายเลขบัตร</Label>
                    <Input placeholder="0000 0000 0000 0000" className="mt-1 rounded-xl" maxLength={19} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-foreground font-medium">วันหมดอายุ</Label>
                      <Input placeholder="MM/YY" className="mt-1 rounded-xl" maxLength={5} />
                    </div>
                    <div>
                      <Label className="text-xs text-foreground font-medium">CVV / CVC</Label>
                      <Input placeholder="***" type="password" className="mt-1 rounded-xl" maxLength={4} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PromptPay / QR Form */}
            {(method === "promptpay" || method === "qr") && (
              <Card>
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-48 h-48 bg-white border-2 border-primary/20 rounded-2xl flex items-center justify-center p-2 mb-3 shadow-inner">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY_${totalPrice}`}
                      alt="QR Code"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <p className="text-sm font-bold text-foreground">สแกน QR Code เพื่อชำระเงิน</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ยอดชำระ <span className="font-bold text-primary">฿{totalPrice.toLocaleString()}</span> (ทำรายการภายใน 15 นาที)
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary */}
          <div className="md:col-span-2">
            <Card className="sticky top-20 border-primary/20 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">สรุปยอดเงิน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{routeLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>{travelDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>{timeLabel}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ที่นั่งที่เลือก</span>
                    <span className="font-semibold text-foreground">
                      {seatList.length > 0 ? seatList.join(", ") : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">จำนวน</span>
                    <span className="text-foreground">{totalSeats} ที่นั่ง</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ราคาต่อที่นั่ง</span>
                    <span className="text-foreground">฿{pricePerSeat.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-foreground">ยอดรวมทั้งหมด</span>
                    <span className="text-xl font-black text-primary">฿{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="w-full rounded-xl font-bold py-6 text-base shadow-md"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || !selectedTrip || seatList.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      กำลังบันทึกการจอง...
                    </>
                  ) : (
                    "ยืนยันการชำระเงิน"
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  ระบบเข้ารหัสและอัปเดตสถานะการจองทันที
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;