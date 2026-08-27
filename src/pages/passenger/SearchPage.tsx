import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  Filter,
  ArrowLeft,
  User,
  RefreshCw,
  Loader2,
  ArrowRightLeft,
  ArrowUpDown,
  Clock,
  Bus,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getUser } from "@/hooks/useAuth";
import { getApiBaseUrl } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THAI_PROVINCES } from "@/lib/thaiProvinces";

type Trip = {
  id: number;
  origin: string;
  destination: string;
  travel_date?: string;
  travelDate?: string;
  departure_date?: string;
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

const formatDateTH = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const SearchPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  // ดึงค่าเริ่มต้นจาก URL UrlSearchParams
  const [origin, setOrigin] = useState(searchParams.get("from") || searchParams.get("origin") || "");
  const [destination, setDestination] = useState(searchParams.get("to") || searchParams.get("destination") || "");
  const [travelDate, setTravelDate] = useState(searchParams.get("date") || "");
  const [busType, setBusType] = useState(searchParams.get("busType") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "departure");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ฟังก์ชันสลับต้นทาง - ปลายทาง
  const handleSwapLocations = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  // ฟังก์ชันกำหนดวันที่ด่วน
  const setQuickDate = (type: "today" | "tomorrow" | "clear") => {
    if (type === "clear") {
      setTravelDate("");
      return;
    }
    const target = new Date();
    if (type === "tomorrow") {
      target.setDate(target.getDate() + 1);
    }
    setTravelDate(target.toISOString().split("T")[0]);
  };

  // ฟังก์ชันค้นหาเที่ยวรถ
  const fetchTrips = useCallback(async (isReset = false) => {
    try {
      setIsLoading(true);
      setError("");

      const currentOrigin = isReset ? "" : origin;
      const currentDestination = isReset ? "" : destination;
      const currentDate = isReset ? "" : travelDate;
      const currentBusType = isReset ? "all" : busType;
      const currentSortBy = isReset ? "departure" : sortBy;

      const params = new URLSearchParams();
      if (currentOrigin) params.append("origin", currentOrigin);
      if (currentDestination) params.append("destination", currentDestination);
      if (currentDate) params.append("date", currentDate);
      if (currentBusType !== "all") params.append("busType", currentBusType);
      if (currentSortBy !== "departure") params.append("sortBy", currentSortBy);

      setSearchParams(params);

      if (currentOrigin || currentDestination || currentDate || currentBusType !== "all" || currentSortBy !== "departure") {
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }

      const res = await fetch(`${apiUrl}/api/trips?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "โหลดข้อมูลเที่ยวรถไม่สำเร็จ");
        return;
      }

      setTrips(Array.isArray(data) ? data : data.trips || []);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, origin, destination, travelDate, busType, sortBy, setSearchParams]);

  // เคลียร์เงื่อนไขการค้นหาทั้งหมด
  const handleResetSearch = () => {
    setOrigin("");
    setDestination("");
    setTravelDate("");
    setBusType("all");
    setSortBy("departure");
    fetchTrips(true);
  };

  // โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchTrips();
  }, []);

  // เลือกที่นั่ง & บันทึกลง LocalStorage
  const handleSelectSeat = (trip: Trip) => {
    const tripData = {
      id: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      travel_date: trip.travel_date || trip.travelDate || trip.departure_date,
      departure_time: (trip.departure_time || trip.departureTime || "").substring(0, 5),
      arrival_time: (trip.arrival_time || trip.arrivalTime || "").substring(0, 5),
      bus_type: trip.bus_type || trip.busType || "ปกติ",
      bus_code: trip.bus_code || trip.busCode || "-",
      price: trip.price,
    };
    localStorage.setItem("selectedTrip", JSON.stringify(tripData));
    navigate(`/passenger/seats?tripId=${trip.id}`);
  };

  // จัดกลุ่มข้อมูลเที่ยวรถตามวันที่
  const groupedTrips = trips.reduce((acc, trip) => {
    const rawDate = trip.travel_date || trip.travelDate || trip.departure_date;
    if (!rawDate) return acc;
    const key = new Date(rawDate).toISOString().split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(trip);
    return acc;
  }, {} as Record<string, Trip[]>);

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/passenger")} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            หน้าแรก
          </Button>

          <h1 className="font-bold text-lg text-foreground flex items-center gap-2">
            <Bus className="w-5 h-5 text-primary" />
            ค้นหาและจองตั๋วเดินทาง
          </h1>

          <Link to="/passenger/profile">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-primary/10 flex items-center justify-center hover:scale-105 transition-transform">
              {(user as any)?.picture_url ? (
                <img src={(user as any).picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ค้นหาเที่ยวรถ SEARCH CARD */}
        <Card className="shadow-md border-border overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Search className="w-4 h-4 text-primary" />
                ระบุข้อมูลเดินทาง
              </span>

              {/* ปุ่มทางลัดเลือกวัน */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant={travelDate === todayStr ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickDate("today")}
                  className="text-xs h-7 rounded-lg px-2.5"
                >
                  วันนี้
                </Button>
                <Button
                  type="button"
                  variant={travelDate === tomorrowStr ? "default" : "outline"}
                  size="sm"
                  onClick={() => setQuickDate("tomorrow")}
                  className="text-xs h-7 rounded-lg px-2.5"
                >
                  พรุ่งนี้
                </Button>
                {travelDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuickDate("clear")}
                    className="text-xs h-7 rounded-lg px-2 text-muted-foreground hover:text-foreground"
                  >
                    ทุกล่าสุด
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* ต้นทาง */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  ต้นทาง
                </label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger className="rounded-xl py-5">
                    <SelectValue placeholder="เลือกจังหวัดต้นทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_PROVINCES.map((p) => (
                      <SelectItem key={`orig-${p}`} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ปุ่มสลับต้นทาง-ปลายทาง */}
              <div className="md:col-span-1 flex justify-center pb-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSwapLocations}
                  className="rounded-full shadow-sm hover:bg-primary/10 hover:text-primary transition-all border-border"
                  title="สลับต้นทาง-ปลายทาง"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
              </div>

              {/* ปลายทาง */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  ปลายทาง
                </label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="rounded-xl py-5">
                    <SelectValue placeholder="เลือกจังหวัดปลายทาง" />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_PROVINCES.map((p) => (
                      <SelectItem key={`dest-${p}`} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* วันที่เดินทาง */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  วันที่เดินทาง
                </label>
                <Input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="rounded-xl py-5"
                />
              </div>

              {/* ปุ่มค้นหา */}
              <div className="md:col-span-2 flex gap-2">
                <Button className="w-full rounded-xl py-5 font-bold shadow-md gap-1.5" onClick={() => fetchTrips()}>
                  <Search className="w-4 h-4" />
                  ค้นหา
                </Button>
                {isSearching && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl h-[42px] shrink-0"
                    onClick={handleResetSearch}
                    title="ล้างการค้นหา"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* แถบตัวกรองเพิ่มเติม (ประเภทรถ / เรียงลำดับ) */}
            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> ประเภทรถ:
                </span>
                {["all", "VIP", "ปกติ", "สองชั้น"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusType(type)}
                    className={`px-3 py-1 rounded-full border transition-all font-medium ${
                      busType === type
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {type === "all" ? "ทั้งหมด" : type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" /> เรียงลำดับ:
                </span>
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val); fetchTrips(); }}>
                  <SelectTrigger className="w-[150px] h-8 rounded-lg text-xs">
                    <SelectValue placeholder="เรียงลำดับ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="departure">เวลาออกเดินทาง</SelectItem>
                    <SelectItem value="price_asc">ราคาต่ำสุดก่อน</SelectItem>
                    <SelectItem value="price_desc">ราคาสูงสุดก่อน</SelectItem>
                    <SelectItem value="seats_desc">ที่นั่งว่างมากที่สุด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* สรุปและรายการผลลัพธ์ */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                {isSearching ? (
                  <>
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    ผลการค้นหาเที่ยวรถ
                  </>
                ) : (
                  <>
                    <Bus className="w-5 h-5 text-primary" />
                    ตารางเที่ยวรถทั้งหมด
                  </>
                )}
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                  {trips.length} เที่ยวรถ
                </span>
              </h2>
              {origin && destination && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {origin} ➔ {destination} {travelDate ? `(วันที่ ${formatDateTH(travelDate)})` : ""}
                </p>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-medium">กำลังค้นหาและอัปเดตตารางเที่ยวรถ...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-10 text-destructive bg-destructive/5 rounded-2xl border border-destructive/20 text-sm font-medium flex flex-col items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && trips.length === 0 && (
            <Card className="border-dashed bg-muted/10">
              <CardContent className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 opacity-60" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-lg text-foreground">ไม่พบเที่ยวรถตามเงื่อนไขที่เลือก</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    ขออภัย ไม่มีรอบรถในเส้นทางหรือวันที่เลือก กรุณาลองสลับเส้นทาง เลือกวันอื่น หรือดูตารางเที่ยวรถทั้งหมด
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={handleSwapLocations}>
                    <ArrowRightLeft className="w-3.5 h-3.5" /> สลับต้นทาง-ปลายทาง
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1" onClick={() => setQuickDate("today")}>
                    <Calendar className="w-3.5 h-3.5" /> ดูของวันนี้
                  </Button>
                  <Button variant="default" size="sm" className="rounded-xl gap-1" onClick={handleResetSearch}>
                    <RefreshCw className="w-3.5 h-3.5" /> ดูตารางรถทั้งหมด
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            !error &&
            Object.entries(groupedTrips).map(([date, items]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs bg-primary/15 text-primary px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-primary/20">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDateTH(date)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">({items.length} รอบเวลา)</span>
                </div>

                <div className="grid gap-3">
                  {items.map((trip) => {
                    const total = Number(trip.total_seats ?? trip.totalSeats ?? 32);
                    const available = trip.available_seats !== undefined && trip.available_seats !== null
                      ? Number(trip.available_seats)
                      : (trip.availableSeats !== undefined && trip.availableSeats !== null
                          ? Number(trip.availableSeats)
                          : total);
                    const dep = (trip.departure_time || trip.departureTime || "").substring(0, 5);
                    const arr = (trip.arrival_time || trip.arrivalTime || "").substring(0, 5);
                    const busTypeStr = trip.bus_type || trip.busType || "ปกติ";

                    const isFull = available <= 0;
                    const isLowSeats = available > 0 && available <= 5;

                    return (
                      <Card
                        key={trip.id}
                        className={`transition-all duration-200 shadow-sm border-border hover:shadow-md ${
                          isFull ? "opacity-60 bg-muted/20" : "hover:border-primary/50"
                        }`}
                      >
                        <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-2.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-lg text-foreground">{trip.origin}</span>
                              <span className="text-primary font-bold">➔</span>
                              <span className="font-bold text-lg text-foreground">{trip.destination}</span>
                              
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                busTypeStr === "VIP" ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                              }`}>
                                {busTypeStr}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
                              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5" /> {dep} น. {arr ? `- ${arr} น.` : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Bus className="w-3.5 h-3.5 text-primary" /> รหัสรถ: <strong className="text-foreground">{trip.bus_code || trip.busCode || "-"}</strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 border-border pt-3 sm:pt-0 shrink-0">
                            <div className="text-left sm:text-right">
                              <p className="text-primary font-black text-2xl tracking-tight">฿{Number(trip.price).toLocaleString()}</p>
                              <p className={`text-xs font-semibold flex items-center justify-start sm:justify-end gap-1 ${
                                isFull ? "text-rose-500" : isLowSeats ? "text-amber-600 font-bold" : "text-emerald-600"
                              }`}>
                                {isFull ? (
                                  "ที่นั่งเต็มแล้ว"
                                ) : isLowSeats ? (
                                  `⚠️ เหลือเพียง ${available} ที่นั่ง!`
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> ว่าง {available} / {total} ที่นั่ง
                                  </>
                                )}
                              </p>
                            </div>

                            <Button
                              className={`min-w-[120px] rounded-xl font-bold py-5 shadow-sm ${
                                isFull ? "" : "hover:scale-105 active:scale-95 transition-all"
                              }`}
                              disabled={isFull}
                              variant={isFull ? "secondary" : "default"}
                              onClick={() => handleSelectSeat(trip)}
                            >
                              {isFull ? "ที่นั่งเต็ม" : "เลือกที่นั่ง"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
};

export default SearchPage;
