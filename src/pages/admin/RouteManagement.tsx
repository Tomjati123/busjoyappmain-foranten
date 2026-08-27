import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, MapPinned, Route as RouteIcon, CheckCircle2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBaseUrl } from "@/lib/api";

type Route = { id: number; route_name: string; start_location: string; end_location: string; distance: number; status: string; schedule_count?: number };
type RouteForm = { route_name: string; start_location: string; end_location: string; distance: string; status: string };
const emptyForm: RouteForm = { route_name: "", start_location: "", end_location: "", distance: "0", status: "active" };
const apiUrl = getApiBaseUrl() || "http://localhost:5000";

const RouteManagement = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/routes`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "โหลดข้อมูลไม่สำเร็จ");
      setRoutes(Array.isArray(data) ? data : []);
    } catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถโหลดข้อมูลเส้นทางได้"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchRoutes(); }, []);

  const filtered = useMemo(() => routes.filter(route => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || [route.route_name, route.start_location, route.end_location].some(value => value?.toLowerCase().includes(query));
    return matchesSearch && (statusFilter === "all" || route.status === statusFilter);
  }), [routes, search, statusFilter]);
  const selected = routes.find(route => route.id === selectedId) || null;
  const activeCount = routes.filter(route => route.status === "active").length;

  const openAdd = () => { setEditRoute(null); setForm(emptyForm); setError(""); setDialogOpen(true); };
  const openEdit = (route: Route) => {
    setEditRoute(route); setSelectedId(route.id); setError("");
    setForm({ route_name: route.route_name, start_location: route.start_location, end_location: route.end_location, distance: String(route.distance || 0), status: route.status });
    setDialogOpen(true);
  };
  const save = async () => {
    if (!form.route_name.trim() || !form.start_location.trim() || !form.end_location.trim()) { setError("กรุณากรอกชื่อเส้นทาง ต้นทาง และปลายทาง"); return; }
    try {
      setSaving(true); setError("");
      const url = editRoute ? `${apiUrl}/api/routes/${editRoute.id}` : `${apiUrl}/api/routes`;
      const response = await fetch(url, { method: editRoute ? "PUT" : "POST", headers, body: JSON.stringify({ ...form, distance: Number(form.distance) || 0 }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");
      setDialogOpen(false); await fetchRoutes(); if (!editRoute && data.id) setSelectedId(data.id);
    } catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถบันทึกได้"); }
    finally { setSaving(false); }
  };
  const remove = async (route: Route) => {
    if (!confirm(`ยืนยันการลบเส้นทาง “${route.route_name}” หรือไม่?`)) return;
    const response = await fetch(`${apiUrl}/api/routes/${route.id}`, { method: "DELETE", headers });
    const data = await response.json();
    if (!response.ok) { setError(data.message || "ลบไม่สำเร็จ"); return; }
    if (selectedId === route.id) setSelectedId(null); fetchRoutes();
  };

  return <AdminLayout><div className="p-6 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-3"><RouteIcon className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">จัดการเส้นทาง</h1></div><p className="mt-1 text-sm text-muted-foreground">กำหนดเส้นทางที่สามารถนำไปใช้กับตารางเดินรถ</p></div><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />เพิ่มเส้นทาง</Button></div>
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="flex items-center gap-3 p-4"><MapPinned className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">เส้นทางทั้งหมด</p><p className="text-2xl font-bold">{routes.length}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-8 w-8 text-success" /><div><p className="text-sm text-muted-foreground">เปิดใช้งาน</p><p className="text-2xl font-bold">{activeCount}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-4"><XCircle className="h-8 w-8 text-muted-foreground" /><div><p className="text-sm text-muted-foreground">ปิดใช้งาน</p><p className="text-2xl font-bold">{routes.length - activeCount}</p></div></CardContent></Card></div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-base">รายการเส้นทาง</CardTitle><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="ค้นหาชื่อ ต้นทาง หรือปลายทาง" value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="สถานะ" /></SelectTrigger><SelectContent><SelectItem value="all">ทุกสถานะ</SelectItem><SelectItem value="active">เปิดใช้งาน</SelectItem><SelectItem value="inactive">ปิดใช้งาน</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="p-0">{loading ? <p className="py-12 text-center text-muted-foreground">กำลังโหลดข้อมูล...</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>ชื่อเส้นทาง</TableHead><TableHead>ต้นทาง - ปลายทาง</TableHead><TableHead>ระยะทาง</TableHead><TableHead>ตารางเดินรถ</TableHead><TableHead>สถานะ</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">ไม่พบเส้นทางที่ตรงกับการค้นหา</TableCell></TableRow> : filtered.map(route => <TableRow key={route.id} onClick={() => setSelectedId(route.id)} className={`cursor-pointer ${selectedId === route.id ? "bg-primary/5" : ""}`}><TableCell className="font-semibold">{route.route_name}</TableCell><TableCell>{route.start_location} <span className="text-muted-foreground">→</span> {route.end_location}</TableCell><TableCell>{Number(route.distance).toLocaleString()} กม.</TableCell><TableCell>{route.schedule_count || 0} เที่ยว</TableCell><TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${route.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{route.status === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEdit(route); }}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="text-destructive" onClick={e => { e.stopPropagation(); remove(route); }}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div>}</CardContent></Card>
    {selected && <Card className="border-primary/30"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-muted-foreground">เส้นทางที่เลือก</p><h2 className="text-lg font-bold">{selected.route_name}</h2><p className="text-sm">{selected.start_location} → {selected.end_location} · {Number(selected.distance).toLocaleString()} กม.</p></div><Button variant="outline" onClick={() => openEdit(selected)}><Pencil className="mr-2 h-4 w-4" />แก้ไขเส้นทางนี้</Button></CardContent></Card>}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editRoute ? "แก้ไขเส้นทาง" : "เพิ่มเส้นทางใหม่"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>ชื่อเส้นทาง</Label><Input className="mt-1" value={form.route_name} onChange={e => setForm({ ...form, route_name: e.target.value })} placeholder="เช่น กรุงเทพฯ - เชียงใหม่" /></div><div className="grid grid-cols-2 gap-3"><div><Label>ต้นทาง</Label><Input className="mt-1" value={form.start_location} onChange={e => setForm({ ...form, start_location: e.target.value })} placeholder="กรุงเทพฯ" /></div><div><Label>ปลายทาง</Label><Input className="mt-1" value={form.end_location} onChange={e => setForm({ ...form, end_location: e.target.value })} placeholder="เชียงใหม่" /></div></div><div><Label>ระยะทาง (กม.)</Label><Input type="number" min="0" className="mt-1" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} /></div><div><Label>สถานะ</Label><Select value={form.status} onValueChange={status => setForm({ ...form, status })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">เปิดใช้งาน</SelectItem><SelectItem value="inactive">ปิดใช้งาน</SelectItem></SelectContent></Select></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</Button></div></DialogContent></Dialog>
  </div></AdminLayout>;
};
export default RouteManagement;
