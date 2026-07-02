import { useNavigate } from "react-router-dom";
import { ArrowLeft, Armchair, Bus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const trips = [
  {
    id: 1,
    route: "กรุงเทพ → เชียงใหม่",
    bus: "VIP-01",
    date: "15 มี.ค. 2569",
    departure: "08:00",
    arrival: "17:00",
    availableSeats: 12,
    totalSeats: 32,
  },
  {
    id: 2,
    route: "กรุงเทพ → ขอนแก่น",
    bus: "STD-03",
    date: "15 มี.ค. 2569",
    departure: "09:30",
    arrival: "15:30",
    availableSeats: 20,
    totalSeats: 40,
  },
];

const StaffSeatManagementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/staff")}> 
            <ArrowLeft className="w-4 h-4 mr-1" /> กลับ
          </Button>
          <h1 className="font-bold text-foreground">จัดการที่นั่งรถ</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายการเที่ยวรถ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trips.map((trip) => (
              <div key={trip.id} className="rounded-2xl border border-border p-4 grid gap-4 md:grid-cols-[1fr_auto] items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Bus className="w-4 h-4" /> {trip.bus}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {trip.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {trip.departure} - {trip.arrival}</span>
                  </div>
                  <div className="text-foreground font-semibold text-lg">{trip.route}</div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary">{trip.availableSeats} / {trip.totalSeats} ที่นั่งว่าง</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground"><Armchair className="w-4 h-4" />รายละเอียดเพิ่มเติม</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => navigate(`/passenger/seats?tripId=${trip.id}`)}>
                    ดูที่นั่ง
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StaffSeatManagementPage;
