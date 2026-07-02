import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bus, Search, Ticket, History, Bell, User, MapPin, Calendar, Users, Star, ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { THAI_PROVINCES } from "@/lib/thaiProvinces";
import { getUser, logout } from "@/hooks/useAuth";

type Trip = {
  id: number;
  origin: string;
  destination: string;
  travel_date: string;
  departure_time: string;
  price: number;
  available_seats: number;
};

type Booking = {
  id: number;
  booking_code: string;
  origin: string;
  destination: string;
  travel_date: string;
  departure_time: string;
  seat_number: string;
  status: string;
};

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [origin, setOrigin] = useState("กรุงเทพมหานคร");
  const [destination, setDestination] = useState("เชียงใหม่");
  const [popularTrips, setPopularTrips] = useState<Trip[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    // 1. ดึงเที่ยวรถยอดนิยม
    const fetchTrips = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/trips/popular");
        const data = await res.json();
        if (!res.ok) {
          setPopularTrips([]);
          return;
        }
        setPopularTrips(Array.isArray(data) ? data.slice(0, 4) : []);
      } catch (err) {
        console.error("Failed to load trips:", err);
      }
    };

    // 2. ดึงการจองของ user
    const fetchBookings = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/users/${user.id}/bookings`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            logout("/login");
            return;
          }
          setUpcomingBookings([]);
          return;
        }
        const upcoming = Array.isArray(data)
          ? data.filter((b: Booking) => b.status === "confirmed").slice(0, 3)
          : [];
        setUpcomingBookings(upcoming);
      } catch (err) {
        console.error("Failed to load bookings:", err);
      }
    };

    // 3. ดึงจำนวนแจ้งเตือนที่ยังไม่ได้อ่าน (ย้ายเข้ามาอยู่ใน useEffect แล้ว)
    const fetchUnreadCount = async () => {
      if (!user?.id) return;
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/users/${user.id}/notifications/unread-count`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        setUnreadNotifications(data.count || 0);
      } catch (err) {
        console.error("Failed to load unread count:", err);
      }
    };

    fetchTrips();
    fetchBookings();
    fetchUnreadCount();
  }, []);

  const goToSearch = (from = origin, to = destination) => {
    const today = new Date().toISOString().split("T")[0];
    navigate(`/passenger/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${today}`);
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
            <span className="font-bold text-foreground text-lg hidden sm:block">จองตั๋วรถทัวร์</span>
          </div>
          
          <nav className="flex items-center gap-1">
            <Link to="/passenger" className="px-3 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg">
              <Search className="w-4 h-4 inline mr-1" />ค้นหาเส้นทาง
            </Link>
            <Link to="/passenger/tickets" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg">
              <Ticket className="w-4 h-4 inline mr-1" />ตั๋วของฉัน
            </Link>
            <Link to="/passenger/history" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg">
              <History className="w-4 h-4 inline mr-1" />ประวัติ
            </Link>
            
            {/* 🔔 ปุ่มแจ้งเตือนเมนูด้านบนที่แก้ไขให้กดไปหน้าแจ้งเตือนได้จริง พร้อมตัวเลขสีแดง */}
            <Link to="/passenger/notifications" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg flex items-center relative">
              <Bell className="w-4 h-4 inline mr-1" />แจ้งเตือน
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </Link>
          </nav>
          
          <div className="flex items-center gap-2">
            <Link to="/passenger/profile" className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-border">
              {(user as any)?.picture_url ? (
                <img src={(user as any).picture_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </Link>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {user?.full_name || user?.username || "ผู้ใช้"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => logout("/login")}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Search */}
        <Card className="mb-8 border-0 bg-secondary text-secondary-foreground overflow-hidden">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold mb-2">ค้นหาเส้นทางของคุณ</h1>
            <p className="opacity-80 mb-6 text-sm">จองตั๋วรถทัวร์ง่ายๆ สะดวก รวดเร็ว ปลอดภัย</p>
            <div className="grid sm:grid-cols-4 gap-3">
              <div className="bg-card/10 backdrop-blur rounded-lg p-3">
                <label className="text-xs opacity-70">ต้นทาง</label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger className="mt-1 h-9 bg-transparent border-primary-foreground/30 text-secondary-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-card/10 backdrop-blur rounded-lg p-3">
                <label className="text-xs opacity-70">ปลายทาง</label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="mt-1 h-9 bg-transparent border-primary-foreground/30 text-secondary-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-card/10 backdrop-blur rounded-lg p-3">
                <label className="text-xs opacity-70">วันที่เดินทาง</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
              <Button size="lg" className="bg-primary-foreground text-secondary hover:bg-primary-foreground/90 h-full" onClick={() => goToSearch()}>
                <Search className="w-4 h-4 mr-2" />ค้นหา
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Popular Routes จาก DB */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-warning" />เส้นทางยอดนิยม
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {popularTrips.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">ไม่พบข้อมูลเส้นทาง</p>
              )}
              {popularTrips.map((trip) => (
                <Card key={trip.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/passenger/seats?tripId=${trip.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground">{trip.origin}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{trip.destination}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date(trip.travel_date).toLocaleDateString("th-TH", {
                        day: "2-digit", month: "short", year: "numeric"
                      })} • {trip.departure_time} น.
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> ว่าง {trip.available_seats} ที่นั่ง
                      </span>
                      <span className="font-bold text-primary">฿{trip.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* การเดินทางเร็วๆ นี้ จาก booking จริง */}
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />การเดินทางเร็วๆ นี้
            </h2>
            <div className="space-y-3">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    ยังไม่มีการเดินทางที่จองไว้
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <p className="font-semibold text-foreground text-sm">
                        {booking.origin} → {booking.destination}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.travel_date).toLocaleDateString("th-TH", {
                          day: "2-digit", month: "short", year: "numeric"
                        })} • {booking.departure_time} น.
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                          ยืนยันแล้ว
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ที่นั่ง {booking.seat_number}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              <Button variant="outline" className="w-full" size="sm" onClick={() => navigate("/passenger/tickets")}>
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