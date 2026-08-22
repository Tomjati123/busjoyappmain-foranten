import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Armchair, Bus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/api";

type Trip = {
  id: number;
  route_name?: string;
  origin?: string;
  destination?: string;
  bus_id?: string | number;
  bus_type?: string;
  departure_date?: string;
  departure_time?: string;
  arrival_time?: string;
  available_seats?: number;
  total_seats?: number;
};

const apiUrl = getApiBaseUrl() || "http://localhost:5000";

const formatDate = (value?: string) => value
  ? new Date(value).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
  : "ไม่ระบุวันที่";

const StaffSeatManagementPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiUrl}/api/bus`)
      .then(async (response) => {
        if (!response.ok) throw new Error("ไม่สามารถโหลดเที่ยวรถได้");
        return response.json();
      })
      .then((data) => setTrips(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || "ไม่สามารถโหลดเที่ยวรถได้"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/staff")}><ArrowLeft className="w-4 h-4 mr-1" />กลับ</Button>
          <h1 className="font-bold text-foreground">จัดการที่นั่งรถ</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">รายการเที่ยวรถจริง</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลดเที่ยวรถ...</p>}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!isLoading && !error && trips.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีเที่ยวรถในระบบ</p>}
            {trips.map((trip) => {
              const totalSeats = Number(trip.total_seats) || 32;
              const availableSeats = Number(trip.available_seats ?? totalSeats);
              const route = trip.route_name || `${trip.origin || "ไม่ระบุต้นทาง"} → ${trip.destination || "ไม่ระบุปลายทาง"}`;
              return (
                <div key={trip.id} className="rounded-2xl border border-border p-4 grid gap-4 md:grid-cols-[1fr_auto] items-center">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Bus className="w-4 h-4" />{trip.bus_id || trip.bus_type || "รถโดยสาร"}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(trip.departure_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{trip.departure_time || "-"} - {trip.arrival_time || "-"}</span>
                    </div>
                    <div className="text-foreground font-semibold text-lg">{route}</div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">{availableSeats} / {totalSeats} ที่นั่งว่าง</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground"><Armchair className="w-4 h-4" />ผังที่นั่งตามข้อมูลจริง</span>
                    </div>
                  </div>
                  <Button onClick={() => navigate(`/passenger/seats?tripId=${trip.id}`)}>ดู/จัดการที่นั่ง</Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StaffSeatManagementPage;
