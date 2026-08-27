import { useEffect, useMemo, useState } from "react";
import { Calendar, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiBaseUrl } from "@/lib/api";

type Schedule = { id: number; route_id: number; route_name: string; origin: string; destination: string; travel_date: string; departure_time: string; arrival_time: string; bus_type: string; bus_id?: number | string; price: number; available_seats: number; total_seats: number; status: string };
type Route = { id: number; route_name: string; start_location: string; end_location: string; status: string };
type Form = { route_id: string; travel_date: string; departure_time: string; arrival_time: string; bus_type: string; bus_id: string; price: string; total_seats: string; status: string };
const emptyForm: Form = { route_id: "", travel_date: "", departure_time: "", arrival_time: "", bus_type: "ปกติ", bus_id: "", price: "", total_seats: "40", status: "open" };
const apiUrl = getApiBaseUrl() || "http://localhost:5000";

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  });

  const load = async () => {
    try {
      setLoading(true);
      const headers = getHeaders();
      const [scheduleResponse, routeResponse] = await Promise.all([fetch(`${apiUrl}/api/trips`, { headers }), fetch(`${apiUrl}/api/routes`, { headers })]);
      const scheduleData = await scheduleResponse.json(); const routeData = await routeResponse.json();
      if (!scheduleResponse.ok) throw new Error(scheduleData.message || "โหลดตารางเดินรถไม่สำเร็จ");
      if (!routeResponse.ok) throw new Error(routeData.message || "โหลดเส้นทางไม่สำเร็จ");
      setSchedules(Array.isArray(scheduleData) ? scheduleData : []); setRoutes(Array.isArray(routeData) ? routeData : []);
    } catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถโหลดข้อมูลได้"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => schedules.filter(item => {
    const q = search.toLowerCase().trim();
    const matches = !q || [item.route_name, item.origin, item.destination, String(item.bus_id || "")].some(v => v?.toLowerCase().includes(q));
    return matches && (statusFilter === "all" || item.status === statusFilter);
  }), [schedules, search, statusFilter]);
  const statusInfo = (status: string) => ({ open: ["เปิดจอง", "bg-success/10 text-success"], full: ["เต็ม", "bg-warning/10 text-warning"], cancelled: ["ยกเลิก", "bg-muted text-muted-foreground"] }[status] || [status, "bg-muted text-muted-foreground"]);
  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(""); setDialogOpen(true); };
  const openEdit = (item: Schedule) => { setEditing(item); setError(""); setForm({ route_id: String(item.route_id), travel_date: item.travel_date?.slice(0, 10), departure_time: item.departure_time?.slice(0, 5), arrival_time: item.arrival_time?.slice(0, 5), bus_type: item.bus_type || "ปกติ", bus_id: String(item.bus_id || ""), price: String(item.price), total_seats: String(item.total_seats), status: item.status }); setDialogOpen(true); };
  const save = async () => {
    if (!form.route_id || !form.travel_date || !form.departure_time || !form.arrival_time || !form.price) { setError("กรุณาเลือกเส้นทางและกรอกข้อมูลให้ครบถ้วน"); return; }
    try {
      setSaving(true); setError("");
      const response = await fetch(editing ? `${apiUrl}/api/trips/${editing.id}` : `${apiUrl}/api/trips`, { method: editing ? "PUT" : "POST", headers: getHeaders(), body: JSON.stringify({ ...form, route_id: Number(form.route_id), bus_id: form.bus_id ? Number(form.bus_id) : null, price: Number(form.price), total_seats: Number(form.total_seats) }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");
      setDialogOpen(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถบันทึกได้"); }
    finally { setSaving(false); }
  };
  const remove = async (item: Schedule) => { if (!confirm(`ยืนยันการลบเที่ยวรถ ${item.origin} → ${item.destination} หรือไม่?`)) return; const response = await fetch(`${apiUrl}/api/trips/${item.id}`, { method: "DELETE", headers: getHeaders() }); const data = await response.json(); if (!response.ok) { setError(data.message || "ลบไม่สำเร็จ"); return; } load(); };

  return <AdminLayout><div className="p-6 space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-3"><Calendar className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">จัดการตารางเดินรถ</h1></div><p className="mt-1 text-sm text-muted-foreground">สร้างเที่ยวรถโดยเลือกจากเส้นทางที่เปิดใช้งาน</p></div><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />เพิ่มเที่ยวรถ</Button></div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-base">เที่ยวรถทั้งหมด</CardTitle><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="ค้นหาเส้นทางหรือรหัสรถ" value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทุกสถานะ</SelectItem><SelectItem value="open">เปิดจอง</SelectItem><SelectItem value="full">เต็ม</SelectItem><SelectItem value="cancelled">ยกเลิก</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="p-0">{loading ? <p className="py-12 text-center text-muted-foreground">กำลังโหลดข้อมูล...</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>เส้นทาง</TableHead><TableHead>วันที่</TableHead><TableHead>เวลา</TableHead><TableHead>ประเภทรถ</TableHead><TableHead>ราคา</TableHead><TableHead>ที่นั่งว่าง</TableHead><TableHead>สถานะ</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">ไม่พบเที่ยวรถ</TableCell></TableRow> : filtered.map(item => { const [label, cls] = statusInfo(item.status); return <TableRow key={item.id}><TableCell className="font-medium">{item.origin} <span className="text-muted-foreground">→</span> {item.destination}</TableCell><TableCell>{new Date(item.travel_date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}</TableCell><TableCell>{item.departure_time?.slice(0, 5)} - {item.arrival_time?.slice(0, 5)}</TableCell><TableCell>{item.bus_type}{item.bus_id ? ` · รถ ${item.bus_id}` : ""}</TableCell><TableCell>฿{Number(item.price).toLocaleString()}</TableCell><TableCell>{item.available_seats}/{item.total_seats}</TableCell><TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{label}</span></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(item)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>; })}</TableBody></Table></div>}</CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editing ? "แก้ไขเที่ยวรถ" : "เพิ่มเที่ยวรถใหม่"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>เส้นทาง</Label><Select value={form.route_id} onValueChange={route_id => setForm({ ...form, route_id })}><SelectTrigger className="mt-1"><SelectValue placeholder="เลือกเส้นทาง" /></SelectTrigger><SelectContent>{routes.filter(route => route.status === "active" || route.id === Number(form.route_id)).map(route => <SelectItem key={route.id} value={String(route.id)}>{route.start_location} → {route.end_location}</SelectItem>)}</SelectContent></Select>{routes.length === 0 && <p className="mt-1 text-xs text-warning">ยังไม่มีเส้นทางที่เปิดใช้งาน กรุณาเพิ่มเส้นทางก่อน</p>}</div><div className="grid grid-cols-2 gap-3"><div><Label>วันที่เดินทาง</Label><Input type="date" className="mt-1" value={form.travel_date} onChange={e => setForm({ ...form, travel_date: e.target.value })} /></div><div><Label>ประเภทรถ</Label><Select value={form.bus_type} onValueChange={bus_type => setForm({ ...form, bus_type })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ปกติ">ปกติ</SelectItem><SelectItem value="VIP">VIP</SelectItem><SelectItem value="สองชั้น">สองชั้น</SelectItem></SelectContent></Select></div></div><div className="grid grid-cols-2 gap-3"><div><Label>เวลาออก</Label><Input type="time" className="mt-1" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} /></div><div><Label>เวลาถึง</Label><Input type="time" className="mt-1" value={form.arrival_time} onChange={e => setForm({ ...form, arrival_time: e.target.value })} /></div></div><div className="grid grid-cols-3 gap-3"><div><Label>ราคา (บาท)</Label><Input type="number" min="0" className="mt-1" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div><div><Label>ที่นั่ง</Label><Input type="number" min="1" className="mt-1" value={form.total_seats} onChange={e => setForm({ ...form, total_seats: e.target.value })} /></div><div><Label>รหัสรถ</Label><Input type="number" min="1" className="mt-1" value={form.bus_id} onChange={e => setForm({ ...form, bus_id: e.target.value })} placeholder="เช่น 1" /></div></div><div><Label>สถานะ</Label><Select value={form.status} onValueChange={status => setForm({ ...form, status })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">เปิดจอง</SelectItem><SelectItem value="full">เต็ม</SelectItem><SelectItem value="cancelled">ยกเลิก</SelectItem></SelectContent></Select></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={save} disabled={saving || routes.length === 0}>{saving ? "กำลังบันทึก..." : "บันทึกเที่ยวรถ"}</Button></div></DialogContent></Dialog>
  </div></AdminLayout>;
};
export default ScheduleManagement;
