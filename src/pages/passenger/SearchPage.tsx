import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Filter,
  ArrowLeft,
  User,
  RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getUser } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THAI_PROVINCES } from "@/lib/thaiProvinces";

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

const formatDateTH = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

const SearchPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [searchParams, setSearchParams] = useSearchParams();

  // ดึงค่าเริ่มต้นจาก URL UrlSearchParams
  const [origin, setOrigin] = useState(searchParams.get("from") || "");
  const [destination, setDestination] = useState(searchParams.get("to") || "");
  const [travelDate, setTravelDate] = useState(searchParams.get("date") || "");
  const [busType, setBusType] = useState(searchParams.get("busType") || "all");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ฟังก์ชันค้นหาเที่ยวรถ (ส่งแบบระบุเงื่อนไข)
  const fetchTrips = async (isReset = false) => {
    try {
      setIsLoading(true);
      setError("");
      
      // ถ้ากดล้างค่า ให้ดึงทริปทั้งหมดมาแสดงผลใหม่
      const currentOrigin = isReset ? "" : origin;
      const currentDestination = isReset ? "" : destination;
      const currentDate = isReset ? "" : travelDate;
      const currentBusType = isReset ? "all" : busType;

      const params = new URLSearchParams();
      if (currentOrigin) params.append("origin", currentOrigin);
      if (currentDestination) params.append("destination", currentDestination);
      if (currentDate) params.append("date", currentDate);
      if (currentBusType !== "all") params.append("busType", currentBusType);

      // อัปเดตพารามิเตอร์บน URL แถบเว็บบราวเซอร์ด้วย
      setSearchParams(params);

      if (currentOrigin || currentDestination || currentDate || currentBusType !== "all") {
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }

      const res = await fetch(`http://localhost:5000/api/trips?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "โหลดข้อมูลไม่สำเร็จ");
        return;
      }

      setTrips(Array.isArray(data) ? data : []);
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setIsLoading(false);
    }
  };

  // ปุ่มเคลียร์เงื่อนไขการค้นหาทั้งหมดกลับสู่ค่าเริ่มต้น
  const handleResetSearch = () => {
    setOrigin("");
    setDestination("");
    setTravelDate("");
    setBusType("all");
    fetchTrips(true);
  };

  // โหลดข้อมูลครั้งแรกอัตโนมัติ
  useEffect(() => {
    fetchTrips();
  }, []);

  // จัดกลุ่มข้อมูลเที่ยวรถตามวันที่เดินทาง เพื่อความสวยงาม
  const groupedTrips = trips.reduce((acc, trip) => {
    if (!trip.travel_date) return acc;
    // ปรับแปลงฟอร์แมตวันที่ให้อยู่ในมาตรฐานสากล YYYY-MM-DD
    const key = new Date(trip.travel_date).toISOString().split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/passenger")}>
            <ArrowLeft className="w-4 h-4 mr-1" />กลับ
          </Button>

          <h1 className="font-bold text-lg">จองตั๋วเดินทาง</h1>

          <Link to="/passenger/profile">
            <div className="w-8 h-8 rounded-full overflow-hidden border">
              {(user as any)?.picture_url ? (
                <img src={(user as any).picture_url} className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 m-2" />
              )}
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* กล่องตัวเลือกค้นหาเที่ยวรถ */}
        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4 grid sm:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">ต้นทาง</label>
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger><MapPin className="w-4 h-4 mr-1 opacity-70" /><SelectValue placeholder="เลือกต้นทาง" /></SelectTrigger>
                <SelectContent>
                  {THAI_PROVINCES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">ปลายทาง</label>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger><MapPin className="w-4 h-4 mr-1 opacity-70" /><SelectValue placeholder="เลือกปลายทาง" /></SelectTrigger>
                <SelectContent>
                  {THAI_PROVINCES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">วันที่เดินทาง</label>
              <Input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">ประเภทรถ</label>
              <Select value={busType} onValueChange={setBusType}>
                <SelectTrigger><Filter className="w-4 h-4 mr-1 opacity-70" />ประเภท</SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="ปกติ">ปกติ</SelectItem>
                  <SelectItem value="สองชั้น">สองชั้น</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => fetchTrips()}>
                <Search className="w-4 h-4 mr-1" />ค้นหา
              </Button>
              {isSearching && (
                <Button variant="outline" size="icon" onClick={handleResetSearch} title="ล้างการค้นหา">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* บล็อกแสดงผลลัพธ์การค้นหา */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-lg text-foreground">
              {isSearching ? `🔍 ผลการค้นหาเที่ยวรถ (${trips.length})` : `🚌 ตารางเที่ยวรถทั้งหมดที่มีในระบบ (${trips.length})`}
            </h2>
          </div>

          {isLoading && (
            <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูลเที่ยวรถ...</div>
          )}
          
          {error && (
            <div className="text-center py-12 text-destructive bg-destructive/5 rounded-lg border border-destructive/20">{error}</div>
          )}

          {!isLoading && !error && trips.length === 0 && (
            <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
              <p className="font-medium text-base text-muted-foreground">❌ ไม่พบเที่ยวรถที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
              <p className="text-xs text-muted-foreground mt-1">โปรดลองเปลี่ยนวันเดินทาง หรือเลือกจังหวัดต้นทาง-ปลายทางใหม่อีกครั้ง</p>
              {isSearching && (
                <Button className="mt-4" variant="outline" size="sm" onClick={handleResetSearch}>ดูตารางรถทั้งหมด</Button>
              )}
            </div>
          )}

          {!isLoading && !error && Object.entries(groupedTrips).map(([date, items]) => (
            <div key={date} className="space-y-3">
              <h3 className="font-semibold text-sm bg-secondary/60 text-secondary-foreground px-3 py-1.5 rounded-md inline-flex items-center gap-1.5">
                📅 {formatDateTH(date)}
              </h3>

              <div className="grid gap-3">
                {items.map(trip => (
                  <Card key={trip.id} className="hover:border-primary/40 transition-all shadow-sm">
                    <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base text-foreground">{trip.origin}</span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="font-bold text-base text-foreground">{trip.destination}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-medium text-amber-600 dark:text-amber-400">🕒 {trip.departure_time} น. - {trip.arrival_time} น.</span>
                          <span>🚌 ประเภท: {trip.bus_type || 'ปกติ'}</span>
                          <span>🆔 รหัสรถ: {trip.bus_code || '-'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                        <div className="text-left sm:text-right">
                          <p className="text-primary font-bold text-lg">฿{trip.price}</p>
                          <p className="text-xs text-muted-foreground">
                            ว่าง {trip.available_seats} / {trip.total_seats} ที่นั่ง
                          </p>
                        </div>

                        <Button
                          className="min-w-[100px]"
                          disabled={Number(trip.available_seats) === 0}
                          variant={Number(trip.available_seats) === 0 ? "secondary" : "default"}
                          onClick={() => navigate(`/passenger/seats?tripId=${trip.id}`)}
                        >
                          {Number(trip.available_seats) === 0 ? "ที่นั่งเต็ม" : "เลือกที่นั่ง"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SearchPage;