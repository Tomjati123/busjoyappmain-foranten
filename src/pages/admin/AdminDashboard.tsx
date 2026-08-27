import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, DollarSign, Armchair, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { getApiBaseUrl } from "@/lib/api";

type Stats = {
  bookingsToday: number;
  revenueToday: number;
  availableSeats: number;
  totalPassengers: number;
  monthlyStats: { month: string; revenue: number; bookings: number }[];
  routeStats: { route: string; bookings: number }[];
};

const AdminDashboard = () => {
  const apiUrl = getApiBaseUrl();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          setError(data.message || "โหลดข้อมูลแดชบอร์ดไม่สำเร็จ");
        }
      } catch {
        setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } finally {
        setIsLoading(false);
      }
  }, [apiUrl]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const cards = stats ? [
    { label: "การจองวันนี้", value: stats.bookingsToday.toString(), icon: <Ticket className="w-5 h-5" />, color: "text-primary", bg: "bg-primary/10" },
    { label: "รายได้วันนี้", value: `฿${stats.revenueToday.toLocaleString()}`, icon: <DollarSign className="w-5 h-5" />, color: "text-success", bg: "bg-success/10" },
    { label: "ที่นั่งว่าง", value: stats.availableSeats.toString(), icon: <Armchair className="w-5 h-5" />, color: "text-warning", bg: "bg-warning/10" },
    { label: "ผู้โดยสารทั้งหมด", value: stats.totalPassengers.toLocaleString(), icon: <Users className="w-5 h-5" />, color: "text-secondary", bg: "bg-secondary/10" },
  ] : [];

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">แดชบอร์ดผู้ดูแลระบบ</h1>

        {error && !isLoading && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchStats}>ลองใหม่</Button>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-16 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            cards.map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-4 rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลแดชบอร์ด
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">รายได้รายเดือน</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats?.monthlyStats || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `฿${Number(v).toLocaleString()}`} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">เส้นทางยอดนิยม</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 bg-muted animate-pulse rounded" />
              ) : !stats?.routeStats || stats.routeStats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  ยังไม่มีข้อมูลการจอง
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats?.routeStats || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="route" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
