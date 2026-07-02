import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, QrCode, Smartphone, MapPin, Clock, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const paymentMethods = [
  { id: "promptpay", label: "PromptPay", icon: <Smartphone className="w-5 h-5" />, desc: "สแกน QR Code ชำระเงิน" },
  { id: "credit", label: "บัตรเครดิต", icon: <CreditCard className="w-5 h-5" />, desc: "Visa / Mastercard" },
  { id: "qr", label: "QR Code ธนาคาร", icon: <QrCode className="w-5 h-5" />, desc: "สแกนผ่านแอปธนาคาร" },
];

const PaymentPage = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState("promptpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<null | {
    id: number;
    origin: string;
    destination: string;
    travel_date: string;
    departure_time: string;
    arrival_time: string;
    bus_type: string;
    price: number;
    seatIds: string[];
  }>(null);

  useEffect(() => {
    const rawTrip = localStorage.getItem("selectedTrip");
    if (!rawTrip) return;
    try {
      setSelectedTrip(JSON.parse(rawTrip));
    } catch {
      setSelectedTrip(null);
    }
  }, []);

  const totalSeats = selectedTrip?.seatIds?.length ?? 2;
  const pricePerSeat = selectedTrip?.price ?? 750;
  const routeLabel = selectedTrip ? `${selectedTrip.origin} → ${selectedTrip.destination}` : "กรุงเทพ → เชียงใหม่";
  const travelDate = selectedTrip?.travel_date
    ? new Date(selectedTrip.travel_date).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "15 มี.ค. 2569";
  const timeLabel = selectedTrip
    ? `${selectedTrip.departure_time} - ${selectedTrip.arrival_time} น.`
    : "08:00 - 17:00 น.";

  const handleConfirmPayment = async () => {
    if (!selectedTrip) return;
    
    try {
      setIsProcessing(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token");

      console.log("TOKEN VALUE:", token); // null = Token is missing
      console.log("USER:", user);

      if (!token) {
        alert("ไม่พบ Token สำหรับยืนยันตัวตน กรุณาเข้าสู่ระบบใหม่");
        navigate("/login");
        return;
      }

      if (!user.id) {
        alert("กรุณาเข้าสู่ระบบก่อนทำรายการ");
        navigate("/login");
        return;
      }

      const bookingData = {
        user_id: user.id,
        schedule_id: selectedTrip.id,
        seat_number: selectedTrip.seatIds.join(","),
        total_price: pricePerSeat * totalSeats,
        payment_method: method
      };

      console.log("BOOKING DATA:", bookingData);

      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token.startsWith("Bearer ") ? token : `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error("เซิร์ฟเวอร์ตอบกลับด้วยรูปแบบข้อมูลที่ไม่ถูกต้อง");
      }

      console.log("BOOKING RESPONSE:", result);
      console.log("STATUS:", response.status);

      if (result.success) {
        localStorage.removeItem("selectedTrip"); // ล้างข้อมูลการเลือกหลังจองสำเร็จ
        navigate(`/passenger/confirmation?bookingCode=${result.booking.booking_code}`);
      } else {
        alert(result.message || "การจองไม่สำเร็จ");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/passenger/seats")}>
            <ArrowLeft className="w-4 h-4 mr-1" />กลับ
          </Button>
          <h1 className="font-bold text-foreground ml-4">ชำระเงินออนไลน์</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-4">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">เลือกช่องทางชำระเงิน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentMethods.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                      method === m.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${method === m.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {m.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {method === "credit" && (
              <Card>
                <CardHeader><CardTitle className="text-base">ข้อมูลบัตรเครดิต</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-foreground">หมายเลขบัตร</Label>
                    <Input placeholder="0000 0000 0000 0000" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-foreground">วันหมดอายุ</Label>
                      <Input placeholder="MM/YY" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-foreground">CVV</Label>
                      <Input placeholder="***" className="mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {(method === "promptpay" || method === "qr") && (
              <Card>
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center mb-4">
                    <QrCode className="w-24 h-24 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">สแกน QR Code เพื่อชำระเงิน</p>
                  <p className="text-xs text-muted-foreground mt-1">รหัสจะหมดอายุใน 15 นาที</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">สรุปยอดเงิน</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />{routeLabel}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />{travelDate}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />{timeLabel}
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ที่นั่ง {selectedTrip?.seatIds?.join(", ") || "A1, A2"}</span>
                    <span className="text-foreground">{totalSeats} ที่นั่ง</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ราคาต่อที่นั่ง</span>
                    <span className="text-foreground">฿{pricePerSeat}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">ยอดรวม</span>
                    <span className="text-primary">฿{pricePerSeat * totalSeats}</span>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  onClick={handleConfirmPayment}
                  disabled={isProcessing || !selectedTrip}
                >
                  {isProcessing ? "กำลังประมวลผล..." : "ชำระเงินทันที"}
                </Button>
                <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />ระบบจะอัปเดตสถานะเรียลไทม์
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
