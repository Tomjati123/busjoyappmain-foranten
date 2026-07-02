import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUser, getUserRole } from "@/hooks/useAuth";

type SeatStatus = "available" | "booked" | "selected" | "unavailable";

type Trip = {
  id: number;
  origin: string;
  destination: string;
  travel_date: string;
  departure_time: string;
  arrival_time: string;
  bus_type: string;
  bus_code: string;
  price: number;
  available_seats: number;
  total_seats: number;
  status: string;
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
  const [trip, setTrip] = useState<Trip | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cancellationSeats, setCancellationSeats] = useState<string[]>([]);

  const currentUser = getUser();
  const gender = String(currentUser?.gender || "").toLowerCase();
  const isFemale = gender === "female" || gender.includes("หญิง");
  const femaleOnlySeatIds = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
  const isStaff = getUserRole(currentUser) === "staff";
  const selectedSeats = useMemo(() => seats.filter((seat) => seat.status === "selected"), [seats]);
  const selectedCancellationSeats = useMemo(
    () => seats.filter((seat) => cancellationSeats.includes(seat.id)),
    [seats, cancellationSeats]
  );
  const pricePerSeat = trip?.price ?? 0;
  const rowCount = Math.ceil((trip?.total_seats ?? 32) / 4);

  const loadTripSeats = async () => {
    if (!tripId) {
      setError("ไม่พบรหัสเที่ยวรถ");
      return;
    }
    setCancellationSeats([]);
    setSuccessMessage("");

    try {
      setIsLoading(true);
      setError("");

      const [tripResponse, seatsResponse] = await Promise.all([
        fetch(`http://localhost:5000/api/trips/${tripId}`),
        fetch(`http://localhost:5000/api/trips/${tripId}/seats`),
      ]);

      const tripData = await tripResponse.json();
      const seatsData = await seatsResponse.json();

      if (!tripResponse.ok) {
        setError(tripData.message || "ไม่สามารถดึงข้อมูลเที่ยวรถได้");
        return;
      }

      if (!seatsResponse.ok) {
        setError(seatsData.message || "ไม่สามารถดึงข้อมูลที่นั่งได้");
        return;
      }

      setTrip(tripData);
      setSeats(
        seatsData.map((seat: { id: string; row: number; col: number; status: SeatStatus }) => ({
          ...seat,
          status: seat.status as SeatStatus,
        }))
      );
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTripSeats();
  }, [tripId]);

  const toggleSeat = (id: string) => {
    setSeats((prev) =>
      prev.map((seat) => {
        if (seat.id !== id) return seat;
        if (isStaff) {
          if (seat.status === "booked") {
            setCancellationSeats((prevIds) =>
              prevIds.includes(id) ? prevIds.filter((seatId) => seatId !== id) : [...prevIds, id]
            );
          }
          return seat;
        }

        if (seat.status === "available") {
          if (femaleOnlySeatIds.has(seat.id.toUpperCase()) && !isFemale) {
            return seat;
          }
          return { ...seat, status: "selected" };
        }
        if (seat.status === "selected") return { ...seat, status: "available" };
        return seat;
      })
    );
  };

  const seatColor = (seat: Seat) => {
    if (isStaff && cancellationSeats.includes(seat.id)) {
      return "bg-destructive text-destructive-foreground border-destructive";
    }

    if (
      !isStaff &&
      seat.status === "available" &&
      femaleOnlySeatIds.has(seat.id.toUpperCase()) &&
      !isFemale
    ) {
      return "bg-muted/10 border-muted text-muted-foreground cursor-not-allowed";
    }

    switch (seat.status) {
      case "available":
        if (femaleOnlySeatIds.has(seat.id.toUpperCase())) {
          return isFemale
            ? "bg-pink-50 border-pink-300 text-pink-700 hover:bg-pink-100 cursor-pointer"
            : "bg-muted/10 border-muted text-muted-foreground cursor-not-allowed";
        }
        return "bg-success/20 border-success text-success hover:bg-success/30 cursor-pointer";
      case "booked":
        return isStaff
          ? "bg-destructive/20 border-destructive text-destructive hover:bg-destructive/30 cursor-pointer"
          : "bg-destructive/20 border-destructive text-destructive cursor-not-allowed";
      case "selected":
        return "bg-primary border-primary text-primary-foreground cursor-pointer";
      case "unavailable":
        return "bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed";
    }
  };

  const reserveSeats = async () => {
    if (!tripId || !trip || selectedSeats.length === 0) return;

    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(`http://localhost:5000/api/trips/${tripId}/seats/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          seatIds: selectedSeats.map((seat) => seat.id),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "จองที่นั่งไม่สำเร็จ");
        return;
      }

      localStorage.setItem(
        "selectedTrip",
        JSON.stringify({
          ...data.trip,
          seatIds: data.seatIds,
        })
      );
      navigate("/passenger/payment");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  const releaseSeats = async () => {
    if (!tripId || selectedCancellationSeats.length === 0) return;

    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(`http://localhost:5000/api/trips/${tripId}/seats/release`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seatIds: selectedCancellationSeats.map((seat) => seat.id) }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "ไม่สามารถยกเลิกที่นั่งได้");
        return;
      }

      setSuccessMessage(data.message || "ยกเลิกการจองที่นั่งเรียบร้อยแล้ว");
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
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-foreground font-medium">ไม่พบรหัสเที่ยวรถ</p>
            <Button onClick={() => navigate("/passenger/search")}>กลับไปหน้าค้นหา</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => navigate("/passenger/search")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับ
          </Button>
          <h1 className="font-bold text-foreground ml-4">เลือกที่นั่ง</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  แผนที่นั่ง - {trip?.bus_type || "กำลังโหลด"} {trip?.total_seats || 0} ที่นั่ง
                </CardTitle>
                <div className="flex gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs">
                    <span className="w-3 h-3 rounded bg-success/30 border border-success" /> ว่าง
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className="w-3 h-3 rounded bg-destructive/30 border border-destructive" /> จองแล้ว
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className="w-3 h-3 rounded bg-primary border border-primary" /> เลือกแล้ว
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className="w-3 h-3 rounded bg-muted border border-muted-foreground/20" /> ไม่ว่าง
                  </span>
                  <span className="flex items-center gap-1 text-xs">
                    <span className="w-3 h-3 rounded bg-pink-50 border border-pink-300" /> เฉพาะผู้หญิง (A1, A2, B1, B2, C1, C2)
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-xl p-6 relative">
                  <div className="flex justify-end mb-4">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">บขส</div>
                  </div>

                  <div className="space-y-2">
                    {Array.from({ length: rowCount }, (_, rowIndex) => (
                      <div key={rowIndex} className="flex items-center justify-center gap-2">
                        {[1, 2].map((col) => {
                          const seat = seats.find((item) => item.row === rowIndex + 1 && item.col === col);
                          if (!seat) {
                            return <div key={col} className="w-12 h-10" />;
                          }

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat.id)}
                              disabled={
                                seat.status === "unavailable" ||
                                (isStaff ? seat.status !== "booked" : seat.status === "booked" || (femaleOnlySeatIds.has(seat.id.toUpperCase()) && !isFemale))
                              }
                              className={`w-12 h-10 rounded-lg border-2 text-xs font-bold transition-all ${seatColor(seat)}`}
                            >
                              {seat.id}
                            </button>
                          );
                        })}
                        <div className="w-6" />
                        {[3, 4].map((col) => {
                          const seat = seats.find((item) => item.row === rowIndex + 1 && item.col === col);
                          if (!seat) {
                            return <div key={col} className="w-12 h-10" />;
                          }

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat.id)}
                              disabled={
                                seat.status === "unavailable" ||
                                (isStaff ? seat.status !== "booked" : seat.status === "booked" || (femaleOnlySeatIds.has(seat.id.toUpperCase()) && !isFemale))
                              }
                              className={`w-12 h-10 rounded-lg border-2 text-xs font-bold transition-all ${seatColor(seat)}`}
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base">สรุปข้อมูลตั๋ว</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{trip ? `${trip.origin} → ${trip.destination}` : "กำลังโหลด..."}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {trip
                        ? new Date(trip.travel_date).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {trip ? `${trip.departure_time} - ${trip.arrival_time} น.` : "-"}
                    </span>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium text-foreground mb-2">
                    ที่นั่งที่เลือก ({selectedSeats.length})
                  </p>
                  {selectedSeats.length === 0 ? (
                    <p className="text-xs text-muted-foreground">ยังไม่ได้เลือกที่นั่ง</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {selectedSeats.map((seat) => (
                        <span key={seat.id} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-medium">
                          {seat.id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ราคา/ที่นั่ง</span>
                    <span className="text-foreground">฿{pricePerSeat}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <span className="text-foreground">รวมทั้งหมด</span>
                    <span className="text-primary">฿{selectedSeats.length * pricePerSeat}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {!isStaff ? (
                    <>
                      <Button
                        className="w-full"
                        disabled={selectedSeats.length === 0 || isLoading || isSaving}
                        onClick={reserveSeats}
                      >
                        {isSaving ? "กำลังจองที่นั่ง..." : "ยืนยันการเลือกที่นั่ง"}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/passenger/search")}>
                        กลับไปเลือกใหม่
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        variant="destructive"
                        disabled={selectedCancellationSeats.length === 0 || isLoading || isSaving}
                        onClick={releaseSeats}
                      >
                        {isSaving ? "กำลังยกเลิกที่นั่ง..." : "ยกเลิกการจองที่นั่ง"}
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/staff")}>
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
