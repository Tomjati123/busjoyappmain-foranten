import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, Download, Loader2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getApiBaseUrl } from "@/lib/api";

type Stats = {
  monthlyStats: { month: string; revenue: string | number; bookings: string | number }[];
  routeStats: { route: string; bookings: string | number }[];
};

const COLORS = ["hsl(217,91%,60%)", "hsl(224,76%,40%)", "hsl(142,72%,37%)", "hsl(38,92%,50%)", "hsl(215,16%,47%)"];

const ReportsPage = () => {
  const apiUrl = getApiBaseUrl();
  const [reportType, setReportType] = useState("revenue");
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setStats(data);
        } else {
          setError(data.message || "โหลดข้อมูลรายงานไม่สำเร็จ");
        }
      } catch (err) {
        setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const barData = stats?.monthlyStats.map(m => ({
    month: m.month,
    revenue: Number(m.revenue),
    bookings: Number(m.bookings)
  })) || [];

  const pieData = stats?.routeStats.map(r => ({
    name: r.route,
    value: Number(r.bookings)
  })) || [];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">รายงานและสถิติ</h1>
          <div className="flex gap-2">
            <Button variant="outline"><FileSpreadsheet className="w-4 h-4 mr-1" />ส่งออก Excel</Button>
            <Button variant="outline"><FileText className="w-4 h-4 mr-1" />ส่งออก PDF</Button>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">รายงานรายได้</SelectItem>
              <SelectItem value="bookings">รายงานการจอง</SelectItem>
              <SelectItem value="routes">รายงานเส้นทาง</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังประมวลผลรายงาน...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-destructive/5 rounded-xl border border-destructive/20 text-destructive text-center px-4">
            <AlertCircle className="w-10 h-10 mb-4" />
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>ลองใหม่อีกครั้ง</Button>
          </div>
        ) : (
          <>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader><CardTitle className="text-base">สถิติรายเดือน</CardTitle></CardHeader>
            <CardContent>
              {barData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">ยังไม่มีข้อมูลสถิติ</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: any) => reportType === 'revenue' ? `฿${Number(value).toLocaleString()}` : value} />
                    <Bar dataKey={reportType === "revenue" ? "revenue" : "bookings"} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">สัดส่วนเส้นทาง</CardTitle></CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">ยังไม่มีข้อมูลการจองตามเส้นทาง</div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                      {pieData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">ตารางสถิติรายเดือน</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เดือน</TableHead>
                  <TableHead>จำนวนการจอง</TableHead>
                  <TableHead>รายได้</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูลสถิติ</TableCell>
                  </TableRow>
                ) : (
                  barData.map(d => (
                  <TableRow key={d.month}>
                    <TableCell className="font-medium">{d.month}</TableCell>
                    <TableCell>{d.bookings}</TableCell>
                    <TableCell className="font-medium">฿{Number(d.revenue).toLocaleString()}</TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
