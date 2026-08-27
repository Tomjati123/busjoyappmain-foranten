import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getToken, getUser, getUserRole } from "@/hooks/useAuth";
import { getApiBaseUrl } from "@/lib/api";

type SeatStatus = "available" | "booked" | "selected" | "unavailable";

type Trip = {
  id: number;
  origin: string;
  destination: string;
  travel_date?: string;
  travelDate?: string;
  departure_time?: string;
  departureTime?: string;
  arrival_time?: string;
  arrivalTime?: string;
  bus_type?: string;
  busType?: string;
  bus_code?: string;
  busCode?: string;
  price: number;
  available_seats?: number;
  availableSeats?: number;
  total_seats?: number;
  totalSeats?: number;
  status?: string;
};

type Seat = {
  id: string;
  row: number;
  col: number;
  status: SeatStatus;
};

const SeatSelectionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get("tripId"); 
  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancellationSeats, setCancellationSeats] = useState<string[]>([]);
  const [isTripUnavailable, setIsTripUnavailable] = useState(false);

  // 🔒 ดึงข้อมูลผู้ใช้และเตรียม Token สำหรับแนบ Header API
  const currentUser = getUser();
  const token = localStorage.getItem("token") || ""; 
  const gender = String(currentUser?.gender || "").toLowerCase();
  const isFemale = gender === "female" || gender.includes("หญิง");
  const femaleOnlySeatIds = useMemo(() => new Set(["A1", "A2", "B1", "B2", "C1", "C2"]), []);
  const isStaff = getUserRole(currentUser) === "staff";

  const selectedSeats = useMemo(() => seats.filter((seat) => seat.status === "selected" && !isStaff), [seats, isStaff]);
  const selectedCancellationSeats = useMemo(
    () => seats.filter((seat) => cancellationSeats.includes(seat.id)),
    [seats, cancellationSeats]
  );

  const pricePerSeat = trip?.price ?? 0;
  const totalSeatsCount = trip?.total_seats ?? trip?.totalSeats ?? 32;
  const rowCount = Math.ceil(totalSeatsCount / 4);

  // 🛠️ Helper สำหรับสร้างส่วนหัวของ Request ที่มีความปลอดภัย
  const getAuthHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  }), [token]);

  // 🔄 ฟังก์ชันดึงข้อมูลจาก Database (ปรับมาใช้โครงสร้าง Route ใหม่: /api/bus/${tripId}/seats)
  const loadTripSeats = useCallback(async (showSilentLoader = false) => {
    if (!tripId) {
      setError("ไม่พบรหัสเที่ยวรถ");
      return;
    }
    if (!showSilentLoader) {
      setIsLoading(true);
    }
    setError("");

    try {
      const [tripResponse, seatsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/bus/${tripId}`, { headers: getAuthHeaders() }), // หรือคงไว้ที่ /api/trips ตามโครงสร้างข้อมูลเที่ยวรถ
        fetch(`${apiUrl}/api/bus/${tripId}/seats`, { headers: getAuthHeaders() }),
      ]);

      if (tripResponse.status === 404 || seatsResponse.status === 404) {
        setIsTripUnavailable(true);
        setError("ไม่พบเที่ยวรถนี้ในระบบ กรุณากลับไปเลือกเที่ยวรถใหม่");
        return;
      }

      if (tripResponse.status === 401 || seatsResponse.status === 401) {
        setError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        return;
      }

      const tripData = await tripResponse.json();
      const seatsData = await seatsResponse.json();

      if (tripResponse.ok) setTrip(tripData);
      
      if (!seatsResponse.ok) {
        setError(seatsData.message || "ไม่สามารถดึงข้อมูลที่นั่งได้");
        return;
      }

      setSeats((currentSeats) => {
        return seatsData.map((dbSeat: { id: string; row: number; col: number; status: SeatStatus }) => {
          if (isStaff && cancellationSeats.includes(dbSeat.id)) {
            return { ...dbSeat, status: "selected" as SeatStatus };
          }
          
          const localSeat = currentSeats.find((s) => s.id === dbSeat.id);
          if (!isStaff && localSeat && localSeat.status === "selected" && dbSeat.status === "available") {
            return { ...dbSeat, status: "selected" as SeatStatus };
          }
          
          return { ...dbSeat, status: dbSeat.status as SeatStatus };
        });
      });
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปเดตสถานะที่นั่งได้");
    } finally {
      setIsLoading(false);
    }
  }, [tripId, apiUrl, isStaff, cancellationSeats, getAuthHeaders]);

  // ⏱️ Real-time Sync: Polling ตรวจสอบสถานะที่นั่งล่าสุดจากฐานข้อมูลทุก 3 วินาที
  useEffect(() => {
    if (!tripId || isTripUnavailable) return;
    
    loadTripSeats(); // โหลดทันทีครั้งแรก
    
    const intervalId = setInterval(() => {
      loadTripSeats(true); // ทำงานเบื้องหลังเงียบๆ ไม่โชว์ Spinner ใหญ่ให้สะดุด
    }, 3000);

    return () => clearInterval(intervalId); // Clear interval เมื่อเปลี่ยนหน้า
  }, [tripId, loadTripSeats, isTripUnavailable]);

  // 🔒 ฟังก์ชันคลิกเลือกที่นั่ง ตรวจสอบสถานะจริงวินาทีต่อวินาทีก่อนเปลี่ยน UI
  const toggleSeat = async (id: string) => {
    setError("");
    setSuccessMessage("");

    try {
      // ดึงสถานะปัจจุบันบน Database ทันทีก่อนประมวลผล Logic ถัดไป
      const res = await fetch(`${apiUrl}/api/bus/${tripId}/seats`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const latestSeatsData = await res.json();
      
      const dbSeat = latestSeatsData.find((s: any) => s.id === id);
      
      if (!dbSeat) {
        setError("ไม่พบข้อมูลที่นั่งนี้ในระบบ");
        return;
      }

      // ป้องกันการแย่งจอง: หากผู้โดยสารทั่วไปกำลังกด แต่หลังบ้านถูก booked ไปแล้ว
      if (!isStaff && dbSeat.status === "booked") {
        setError(`ขออภัย ที่นั่ง ${id} มีผู้จองตัดหน้าไปเรียบร้อยแล้ว`);
        setSeats(latestSeatsData.map((s: any) => ({ ...s, status: s.status as SeatStatus })));
        return; 
      }

      setSeats((prev) =>
        prev.map((seat) => {
          if (seat.id !== id) return seat;

          if (isStaff) {
            if (seat.status === "booked") {
              setCancellationSeats((prevIds) => [...prevIds, id]);
              return { ...seat, status: "selected" }; 
            }
            if (seat.status === "selected") {
              setCancellationSeats((prevIds) => prevIds.filter((seatId) => seatId !== id));
              return { ...seat, status: "booked" }; 
            }
            return seat;
          }

          if (seat.status === "available") {
            if (femaleOnlySeatIds.has(seat.id.toUpperCase()) && !isFemale) {
              setError("ที่นั่งแถวหน้า (A1, A2, B1, B2, C1, C2) เฉพาะผู้โดยสารผู้หญิงเท่านั้น");
              return seat; 
            }
            return { ...seat, status: "selected" };
          }
          
          if (seat.status === "selected") {
            return { ...seat, status: "available" };
          }
          return seat;
        })
      );

    } catch {
      setError("เกิดข้อผิดพลาดในการตรวจสอบสถานะที่นั่งกับฐานข้อมูล");
    }
  };

  const isSeatDisabled = (seat: Seat) => {
    if (seat.status === "unavailable") return true;
    if (isStaff) {
      return seat.status !== "booked" && seat.status !== "selected";
    } else {
      if (seat.status === "booked") return true;
      const isFemaleOnly = femaleOnlySeatIds.has(seat.id.toUpperCase());
      if (isFemaleOnly && !isFemale) return true;
      return false;
    }
  };

  const seatColor = (seat: Seat) => {
    if (seat.status === "unavailable") {
      return "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-40 pointer-events-none";
    }
    if (!isStaff && femaleOnlySeatIds.has(seat.id.toUpperCase()) && !isFemale) {
      return "bg-muted/10 border-muted text-muted-foreground cursor-not-allowed opacity-50 pointer-events-none";
    }
    if (seat.status === "selected") {
      return isStaff
        ? "bg-destructive text-destructive-foreground border-destructive cursor-pointer shadow-sm animate-pulse" 
        : "bg-primary border-primary text-primary-foreground cursor-pointer shadow-sm"; 
    }
    if (seat.status === "booked") {
      return isStaff
        ? "bg-red-500 border-red-600 text-white hover:bg-red-600 cursor-pointer shadow-sm" 
        : "bg-red-100 border-red-300 text-red-400 cursor-not-allowed opacity-70 pointer-events-none select-none"; 
    }
    if (femaleOnlySeatIds.has(seat.id.toUpperCase())) {
      return "bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100 cursor-pointer";
    }
    return "bg-emerald-50 border-emerald-400 text-emerald-700 hover:bg-emerald-100 cursor-pointer";
  };

  // 🔒 ยืนยันการจอง (แนบ Token + ปรับ Route ใหม่)
  const reserveSeats = async () => {
    if (!tripId || !trip || selectedSeats.length === 0) return;

    const currentToken = getToken();
    if (!currentToken) {
      setError("ไม่พบ Token หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบก่อนทำการจองที่นั่ง");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
      return;
    }

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(`${apiUrl}/api/bus/${tripId}/seats/reserve`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ seatIds: selectedSeats.map((seat) => seat.id) }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError(data.message || "เซสชันหมดอายุ หรือยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบอีกครั้ง");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setTimeout(() => {
            navigate("/login");
          }, 1500);
          return;
        }
        setError((data.message || "จองที่นั่งไม่สำเร็จ") + (data.error ? `: ${data.error}` : ""));
        loadTripSeats(true); 
        return;
      }

      const updatedTrip = {
        ...trip,
        ...(data.trip || {}),
        seatIds: selectedSeats.map((s) => s.id),
        selectedSeats: selectedSeats.map((s) => s.id),
      };

      localStorage.setItem("selectedTrip", JSON.stringify(updatedTrip));
      navigate("/passenger/payment");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔒 พนักงานยกเลิกตั๋ว/คืนที่นั่ง (แนบ Token + ปรับ Route ใหม่)
  const releaseSeats = async () => {
    if (!tripId || cancellationSeats.length === 0) return;

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`${apiUrl}/api/bus/${tripId}/seats/release`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ seatIds: cancellationSeats }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "ไม่สามารถยกเลิกที่นั่งได้");
        return;
      }

      setSuccessMessage(data.message || "ยกเลิกการจองและคืนสิทธิ์ที่นั่งเรียบร้อยแล้ว");
      setCancellationSeats([]);
      loadTripSeats(); 
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (!tripId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-foreground font-medium">ไม่พบรหัสเที่ยวรถ</p>
            <Button onClick={() => navigate("/passenger/search")}>กลับไปหน้าค้นหา</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTripUnavailable) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-foreground font-medium">ไม่พบเที่ยวรถนี้ในระบบ</p>
            <Button onClick={() => navigate("/staff/seats")}>กลับไปจัดการที่นั่ง</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const travelDateFormatted = () => {
    const rawDate = trip?.travel_date || trip?.travelDate;
    if (!rawDate) return "-";
    try {
      return new Date(rawDate).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return rawDate;
    }
  };

  const depTime = (trip?.departure_time || trip?.departureTime || "").substring(0, 5);
  const arrTime = (trip?.arrival_time || trip?.arrivalTime || "").substring(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => navigate(isStaff ? "/staff/seats" : "/passenger/search")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
            </Button>
            <h1 className="font-bold text-foreground ml-4">
              {isStaff ? "จัดการที่นั่งเที่ยวรถ" : "เลือกที่นั่ง (Real-time Sync)"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadTripSeats(false)} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            อัปเดตสถานะที่นั่ง
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>
                    แผนที่นั่ง - {trip?.bus_type || trip?.busType || "ปกติ"} ({totalSeatsCount} ที่นั่ง)
                  </span>
                </CardTitle>

                <div className="flex flex-wrap gap-3 mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" /> ว่าง
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-100 border border-red-400" /> จองแล้ว
                  </span>
                  <span className="flex items-center gap-1">
                    <span className={`w-3 h-3 rounded border ${isStaff ? "bg-destructive border-destructive" : "bg-primary border-primary"}`} />
                    {isStaff ? "เลือกเพื่อคืนที่นั่ง" : "เลือกแล้ว"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-pink-50 border border-pink-300" /> เฉพาะผู้หญิง
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-2xl p-6 relative border border-border">
                  <div className="flex justify-end mb-6">
                    <div className="w-12 h-10 bg-muted rounded-lg flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
                      คนขับ
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Array.from({ length: rowCount }, (_, rowIndex) => (
                      <div key={rowIndex} className="flex items-center justify-center gap-2">
                        {[1, 2].map((col) => {
                          const seat = seats.find((item) => item.row === rowIndex + 1 && item.col === col);
                          if (!seat) return <div key={col} className="w-11 h-10" />;

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat.id)}
                              disabled={isSeatDisabled(seat)}
                              className={`w-11 h-10 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center ${seatColor(
                                seat
                              )}`}
                            >
                              {seat.id}
                            </button>
                          );
                        })}
                        <div className="w-6" />
                        {[3, 4].map((col) => {
                          const seat = seats.find((item) => item.row === rowIndex + 1 && item.col === col);
                          if (!seat) return <div key={col} className="w-11 h-10" />;

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat.id)}
                              disabled={isSeatDisabled(seat)}
                              className={`w-11 h-10 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center ${seatColor(
                                seat
                              )}`}
                            >
                              {seat.id}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">สรุปข้อมูลตั๋ว</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">
                      {trip ? `${trip.origin} → ${trip.destination}` : "กำลังโหลด..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>{travelDateFormatted()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>{depTime ? `${depTime} น. ${arrTime ? `- ${arrTime} น.` : ""}` : "-"}</span>
                  </div>
                </div>

                {error && <p className="text-xs font-medium text-destructive bg-destructive/5 p-2.5 rounded-lg">{error}</p>}
                {successMessage && <p className="text-xs font-medium text-emerald-600 bg-emerald-50 p-2.5 rounded-lg">{successMessage}</p>}

                {isStaff && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    คลิกที่นั่งสีแดงเพื่อเลือกคืนสิทธิ์ จากนั้นกดยืนยันการคืนที่นั่ง
                  </p>
                )}

                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium text-foreground mb-2">
                    ที่นั่งที่เลือก ({isStaff ? selectedCancellationSeats.length : selectedSeats.length})
                  </p>
                  {(isStaff ? selectedCancellationSeats : selectedSeats).length === 0 ? (
                    <p className="text-xs text-muted-foreground">ยังไม่ได้เลือกที่นั่ง</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(isStaff ? selectedCancellationSeats : selectedSeats).map((seat) => (
                        <span
                          key={seat.id}
                          className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-lg font-bold"
                        >
                          {seat.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ราคา/ที่นั่ง</span>
                    <span className="text-foreground font-semibold">฿{pricePerSeat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <span className="text-foreground">รวมทั้งหมด</span>
                    <span className="text-primary font-black">
                      ฿{(selectedSeats.length * pricePerSeat).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {!isStaff ? (
                    <>
                      <Button
                        className="w-full rounded-xl font-bold"
                        disabled={selectedSeats.length === 0 || isLoading || isSaving}
                        onClick={reserveSeats}
                      >
                        {isSaving ? "กำลังจองที่นั่ง..." : "ยืนยันการเลือกที่นั่ง"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={() => navigate("/passenger/search")}
                      >
                        กลับไปเลือกเที่ยวรถใหม่
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="w-full rounded-xl font-bold"
                        variant="destructive"
                        disabled={selectedCancellationSeats.length === 0 || isLoading || isSaving}
                        onClick={releaseSeats}
                      >
                        {isSaving ? "กำลังคืนที่นั่ง..." : "ยืนยันการคืนที่นั่ง"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={() => navigate("/staff")}
                      >
                        กลับไปหน้าพนักงาน
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SeatSelectionPage;
