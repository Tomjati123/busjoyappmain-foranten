import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Bus, CheckCircle2, Wrench, XCircle } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

type FleetBus = { id: number; bus_number: string; bus_type: string; total_seats: number; status: string; schedule_count?: number };
type BusForm = { bus_number: string; bus_type: string; total_seats: string; status: string };
const emptyForm: BusForm = { bus_number: "", bus_type: "ปกติ", total_seats: "40", status: "active" };
const apiUrl = getApiBaseUrl() || "http://localhost:5000";

const BusManagement = () => {
  const [buses, setBuses] = useState<FleetBus[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FleetBus | null>(null);
  const [form, setForm] = useState<BusForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };

  const load = async () => {
    try { setLoading(true); const response = await fetch(`${apiUrl}/api/buses`, { headers }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "โหลดข้อมูลรถไม่สำเร็จ"); setBuses(Array.isArray(data) ? data : []); }
    catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถโหลดข้อมูลรถได้"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => buses.filter(bus => { const q = search.toLowerCase().trim(); const matches = !q || bus.bus_number.toLowerCase().includes(q) || bus.bus_type.toLowerCase().includes(q); return matches && (statusFilter === "all" || bus.status === statusFilter); }), [buses, search, statusFilter]);
  const active = buses.filter(bus => bus.status === "active").length;
  const maintenance = buses.filter(bus => bus.status === "maintenance").length;
  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(""); setDialogOpen(true); };
  const openEdit = (bus: FleetBus) => { setEditing(bus); setError(""); setForm({ bus_number: bus.bus_number, bus_type: bus.bus_type, total_seats: String(bus.total_seats), status: bus.status }); setDialogOpen(true); };
  const save = async () => {
    if (!form.bus_number.trim() || Number(form.total_seats) <= 0) { setError("กรุณากรอกหมายเลขรถและจำนวนที่นั่งให้ถูกต้อง"); return; }
    try { setSaving(true); setError(""); const response = await fetch(editing ? `${apiUrl}/api/buses/${editing.id}` : `${apiUrl}/api/buses`, { method: editing ? "PUT" : "POST", headers, body: JSON.stringify({ ...form, total_seats: Number(form.total_seats) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ"); setDialogOpen(false); load(); }
    catch (e) { setError(e instanceof Error ? e.message : "ไม่สามารถบันทึกข้อมูลได้"); }
    finally { setSaving(false); }
  };
  const remove = async (bus: FleetBus) => { if (!confirm(`ยืนยันการลบรถหมายเลข ${bus.bus_number} หรือไม่?`)) return; const response = await fetch(`${apiUrl}/api/buses/${bus.id}`, { method: "DELETE", headers }); const data = await response.json(); if (!response.ok) { setError(data.message || "ลบไม่สำเร็จ"); return; } load(); };
  const statusInfo = (status: string) => ({ active: ["พร้อมใช้งาน", "bg-success/10 text-success"], maintenance: ["ซ่อมบำรุง", "bg-warning/10 text-warning"], inactive: ["ไม่ใช้งาน", "bg-muted text-muted-foreground"] }[status] || [status, "bg-muted text-muted-foreground"]);

  return <AdminLayout><div className="p-6 space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-3"><Bus className="h-7 w-7 text-primary" /><h1 className="text-2xl font-bold">จัดการรถโดยสาร</h1></div><p className="mt-1 text-sm text-muted-foreground">จัดการรถและจำนวนที่นั่งสำหรับใช้ในตารางเดินรถ</p></div><Button onClick={openAdd}><Plus className="mr-2 h-4 w-4" />เพิ่มรถ</Button></div>
    <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="flex items-center gap-3 p-4"><Bus className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">รถทั้งหมด</p><p className="text-2xl font-bold">{buses.length}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-8 w-8 text-success" /><div><p className="text-sm text-muted-foreground">พร้อมใช้งาน</p><p className="text-2xl font-bold">{active}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3 p-4"><Wrench className="h-8 w-8 text-warning" /><div><p className="text-sm text-muted-foreground">ซ่อมบำรุง</p><p className="text-2xl font-bold">{maintenance}</p></div></CardContent></Card></div>
    <Card><CardHeader className="pb-3"><CardTitle className="text-base">รายการรถโดยสาร</CardTitle><div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="ค้นหาหมายเลขรถหรือประเภทรถ" value={search} onChange={e => setSearch(e.target.value)} /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ทุกสถานะ</SelectItem><SelectItem value="active">พร้อมใช้งาน</SelectItem><SelectItem value="maintenance">ซ่อมบำรุง</SelectItem><SelectItem value="inactive">ไม่ใช้งาน</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="p-0">{loading ? <p className="py-12 text-center text-muted-foreground">กำลังโหลดข้อมูล...</p> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>หมายเลขรถ</TableHead><TableHead>ประเภทรถ</TableHead><TableHead>จำนวนที่นั่ง</TableHead><TableHead>ตารางเดินรถ</TableHead><TableHead>สถานะ</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader><TableBody>{filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">ไม่พบข้อมูลรถ</TableCell></TableRow> : filtered.map(bus => { const [label, cls] = statusInfo(bus.status); return <TableRow key={bus.id}><TableCell className="font-semibold">{bus.bus_number}</TableCell><TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${bus.bus_type === "VIP" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{bus.bus_type}</span></TableCell><TableCell>{bus.total_seats} ที่นั่ง</TableCell><TableCell>{bus.schedule_count || 0} เที่ยว</TableCell><TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{label}</span></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => openEdit(bus)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(bus)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>; })}</TableBody></Table></div>}</CardContent></Card>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>หมายเลขรถ</Label><Input className="mt-1" value={form.bus_number} onChange={e => setForm({ ...form, bus_number: e.target.value })} placeholder="เช่น VIP-01" /></div><div><Label>ประเภทรถ</Label><Select value={form.bus_type} onValueChange={bus_type => setForm({ ...form, bus_type })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ปกติ">ปกติ</SelectItem><SelectItem value="VIP">VIP</SelectItem><SelectItem value="สองชั้น">สองชั้น</SelectItem></SelectContent></Select></div><div><Label>จำนวนที่นั่ง</Label><Input type="number" min="1" className="mt-1" value={form.total_seats} onChange={e => setForm({ ...form, total_seats: e.target.value })} /></div><div><Label>สถานะ</Label><Select value={form.status} onValueChange={status => setForm({ ...form, status })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">พร้อมใช้งาน</SelectItem><SelectItem value="maintenance">ซ่อมบำรุง</SelectItem><SelectItem value="inactive">ไม่ใช้งาน</SelectItem></SelectContent></Select></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button className="w-full" onClick={save} disabled={saving}>{saving ? "กำลังบันทึก..." : "บันทึกข้อมูลรถ"}</Button></div></DialogContent></Dialog>
  </div></AdminLayout>;
};
export default BusManagement;
