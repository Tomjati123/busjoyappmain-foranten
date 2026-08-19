import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bus, Search, Ticket, History, Bell, User, MapPin, Calendar, Users, Star, ChevronRight, LogOut, Loader2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THAI_PROVINCES } from "@/lib/thaiProvinces";
import { getUser, logout } from "@/hooks/useAuth";
import { getApiBaseUrl } from "@/lib/api";

type Trip = {
  id: number;
  origin?: string;
  destination?: string;
  travel_date?: string;
  travelDate?: string;
  departure_time?: string;
  departureTime?: string;
  price?: number;
  available_seats?: number;
  availableSeats?: number;
};

type Booking = {
  id: number;
  booking_code?: string;
  bookingCode?: string;
  origin?: string;
  destination?: string;
  travel_date?: string;
  travelDate?: string;
  departure_time?: string;
  departureTime?: string;
  seat_number?: string;
  seatNumber?: string;
  status?: string;
};

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [origin, setOrigin] = useState("กรุงเทพมหานคร");
  const [destination, setDestination] = useState("เชียงใหม่");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [popularTrips, setPopularTrips] = useState<Trip[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 1. ดึงเที่ยวรถยอดนิยม
    const fetchTrips = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/trips/popular`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.trips || [];
          setPopularTrips(list.slice(0, 4));
        } else {
          setPopularTrips([]);
        }
      } catch (err) {
        console.error("Failed to load trips:", err);
      }
    };

    // 2. ดึงการจองของ user
    const fetchBookings = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${apiUrl}/api/users/${user.id}/bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const list: Booking[] = Array.isArray(data) ? data : data.bookings || [];
          
          const upcoming = list
            .filter((b) => {
              const st = b.status?.toLowerCase();
              return st === "confirmed" || st === "paid" || st === "ยืนยันแล้ว";
            })
            .slice(0, 3);

          setUpcomingBookings(upcoming);
        } else if (res.status === 401 || res.status === 403) {
          logout("/login");
        }
      } catch (err) {
        console.error("Failed to load bookings:", err);
      }
    };

    // 3. ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${apiUrl}/api/users/${user.id}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadNotifications(data.count || data.unreadCount || 0);
        }
      } catch (err) {
        console.error("Failed to load unread count:", err);
      }
    };

    const loadAllData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTrips(), fetchBookings(), fetchUnreadCount()]);
      setIsLoading(false);
    };

    loadAllData();
  }, [apiUrl, user?.id]);

  const goToSearch = (from = origin, to = destination, date = selectedDate) => {
    navigate(
      `/passenger/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-lg hidden sm:block">
              จองตั๋วรถทัวร์
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <Link
              to="/passenger"
              className="px-3 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg flex items-center"
            >
              <Search className="w-4 h-4 mr-1.5" />
              ค้นหาเส้นทาง
            </Link>
            <Link
              to="/passenger/tickets"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg flex items-center"
            >
              <Ticket className="w-4 h-4 mr-1.5" />
              ตั๋วของฉัน
            </Link>

            {/* 🔔 ปุ่มแจ้งเตือน */}
            <Link
              to="/passenger/notifications"
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg flex items-center relative"
            >
              <Bell className="w-4 h-4 mr-1.5" />
              <span className="hidden md:inline">แจ้งเตือน</span>
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-background">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/passenger/profile"
              className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-border"
            >
              {(user as any)?.picture_url || (user as any)?.avatar ? (
                <img
                  src={(user as any).picture_url || (user as any).avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </Link>
            <span className="text-sm font-medium text-foreground hidden sm:block max-w-[120px] truncate">
              {user?.full_name || user?.username || "ผู้ใช้"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => logout("/login")}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Search Card */}
        <Card className="mb-8 border-0 bg-primary text-primary-foreground shadow-lg overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">ค้นหาเส้นทางของคุณ</h1>
            <p className="opacity-90 mb-6 text-xs md:text-sm">
              จองตั๋วรถทัวร์ง่ายๆ สะดวก รวดเร็ว และปลอดภัย
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
              {/* Origin */}
              <div className="lg:col-span-3 bg-background/10 backdrop-blur rounded-xl p-3 border border-white/10">
                <label className="text-[11px] opacity-80 block mb-1">ต้นทาง</label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger className="h-9 bg-transparent border-white/20 text-primary-foreground focus:ring-0">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 opacity-80" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {THAI_PROVINCES.map((p) => (
                      <SelectItem key={`dash-orig-${p}`} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Swap Button */}
              <div className="lg:col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const temp = origin;
                    setOrigin(destination);
                    setDestination(temp);
                  }}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
                  title="สลับต้นทาง-ปลายทาง"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Destination */}
              <div className="lg:col-span-3 bg-background/10 backdrop-blur rounded-xl p-3 border border-white/10">
                <label className="text-[11px] opacity-80 block mb-1">ปลายทาง</label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="h-9 bg-transparent border-white/20 text-primary-foreground focus:ring-0">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 opacity-80" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {THAI_PROVINCES.map((p) => (
                      <SelectItem key={`dash-dest-${p}`} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="lg:col-span-3 bg-background/10 backdrop-blur rounded-xl p-3 border border-white/10">
                <label className="text-[11px] opacity-80 block mb-1">วันที่เดินทาง</label>
                <div className="flex items-center gap-2 h-9">
                  <Calendar className="w-4 h-4 shrink-0 opacity-80" />
                  <input
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-sm font-medium w-full focus:outline-none cursor-pointer text-primary-foreground [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Search Button */}
              <Button
                size="lg"
                className="lg:col-span-2 bg-white text-primary hover:bg-white/90 font-bold h-[62px] rounded-xl shadow-md"
                onClick={() => goToSearch()}
              >
                <Search className="w-4 h-4 mr-2" />
                ค้นหาเที่ยวรถ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Popular Routes */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              เส้นทางยอดนิยม
            </h2>

            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                กำลังโหลดเที่ยวรถ...
              </div>
            ) : popularTrips.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  ไม่พบข้อมูลเส้นทางยอดนิยมในขณะนี้
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {popularTrips.map((trip) => {
                  const rawDate = trip.travel_date || trip.travelDate;
                  const dateStr = rawDate
                    ? new Date(rawDate).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";
                  const depTime = (trip.departure_time || trip.departureTime || "").substring(0, 5);
                  const seats = trip.available_seats ?? trip.availableSeats ?? 0;
                  const price = trip.price || 0;

                  return (
                    <Card
                      key={trip.id}
                      className="hover:shadow-md transition-all cursor-pointer border-border/80 hover:border-primary/50"
                      onClick={() => navigate(`/passenger/seats?tripId=${trip.id}`)}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground text-sm">
                          <span>{trip.origin || "ต้นทาง"}</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>{trip.destination || "ปลายทาง"}</span>
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{dateStr}</span>
                          {depTime && <span>• {depTime} น.</span>}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-primary" /> ว่าง {seats} ที่นั่ง
                          </span>
                          <span className="font-extrabold text-primary text-sm">
                            ฿{Number(price).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Trips */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              การเดินทางเร็วๆ นี้
            </h2>

            <div className="space-y-3">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">ยังไม่มีการเดินทางที่จองไว้</p>
                    <p>ค้นหาและจองตั๋วเพื่อเริ่มต้นการเดินทางของคุณ</p>
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map((booking) => {
                  const code = booking.booking_code || booking.bookingCode;
                  const rawDate = booking.travel_date || booking.travelDate;
                  const dateStr = rawDate
                    ? new Date(rawDate).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "-";
                  const depTime = (booking.departure_time || booking.departureTime || "").substring(0, 5);
                  const seat = booking.seat_number || booking.seatNumber || "-";

                  return (
                    <Card key={booking.id} className="shadow-sm">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground text-sm">
                            {booking.origin} → {booking.destination}
                          </p>
                          {code && (
                            <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {code}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {dateStr} {depTime ? `• ${depTime} น.` : ""}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <span className="text-[11px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                            ยืนยันแล้ว
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            ที่นั่ง <span className="text-foreground font-bold">{seat}</span>
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}

              <Button
                variant="outline"
                className="w-full rounded-xl"
                size="sm"
                onClick={() => navigate("/passenger/tickets")}
              >
                ดูตั๋วทั้งหมด
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PassengerDashboard;