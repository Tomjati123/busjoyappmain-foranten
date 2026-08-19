import { useState, useEffect } from "react";
import { Calendar, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { THAI_PROVINCES } from "@/lib/thaiProvinces";
import { getApiBaseUrl } from "@/lib/api";

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

const emptyForm = {
  origin: "", destination: "", travel_date: "", departure_time: "",
  arrival_time: "", bus_type: "ปกติ", bus_code: "", price: "", total_seats: "40", status: "open"
};

const ScheduleManagement = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const fetchTrips = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${apiUrl}/api/trips`, { headers });
      const data = await res.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const openAdd = () => {
    setEditTrip(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (trip: Trip) => {
    setEditTrip(trip);
    setForm({
      origin: trip.origin, destination: trip.destination,
      travel_date: trip.travel_date, departure_time: trip.departure_time,
      arrival_time: trip.arrival_time, bus_type: trip.bus_type,
      bus_code: trip.bus_code, price: String(trip.price),
      total_seats: String(trip.total_seats), status: trip.status
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.origin || !form.destination || !form.travel_date || !form.departure_time || !form.arrival_time || !form.price) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    try {
      setIsSaving(true);
      setError("");
      const url = editTrip ? `${apiUrl}/api/trips/${editTrip.id}` : `${apiUrl}/api/trips`;
      const method = editTrip ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify({
        ...form, price: Number(form.price), total_seats: Number(form.total_seats)
      })});
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setDialogOpen(false);
      fetchTrips();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบเที่ยวรถนี้?")) return;
    const res = await fetch(`${apiUrl}/api/trips/${id}`, { method: "DELETE", headers });
    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    fetchTrips();
  };

  const filtered = trips.filter(t =>
    t.origin?.includes(search) || t.destination?.includes(search) || t.bus_code?.includes(search)
  );

  const statusLabel = (s: string) => ({
    open: { text: "เปิดจอง", cls: "bg-success/10 text-success" },
    full: { text: "เต็ม", cls: "bg-destructive/10 text-destructive" },
    cancelled: { text: "ยกเลิก", cls: "bg-muted text-muted-foreground" },
  }[s] || { text: s, cls: "bg-muted text-muted-foreground" });

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">จัดการตารางเดินรถ</h1>
          </div>
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />เพิ่มเที่ยวรถ</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-sm mb-4">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="ค้นหาต้นทาง ปลายทาง รหัสรถ..." className="pl-9"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>เส้นทาง</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>เวลา</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ราคา</TableHead>
                    <TableHead>ที่นั่ง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูลเที่ยวรถ</TableCell>
                    </TableRow>
                  ) : filtered.map(trip => {
                    const { text, cls } = statusLabel(trip.status);
                    return (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.id}</TableCell>
                        <TableCell className="font-medium">{trip.origin} → {trip.destination}</TableCell>
                        <TableCell>{new Date(trip.travel_date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                        <TableCell>{trip.departure_time} - {trip.arrival_time}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${trip.bus_type === 'VIP' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground'}`}>
                            {trip.bus_type}
                          </span>
                        </TableCell>
                        <TableCell>฿{trip.price.toLocaleString()}</TableCell>
                        <TableCell>{trip.available_seats}/{trip.total_seats}</TableCell>
                        <TableCell><span className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>{text}</span></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(trip)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(trip.id)}><Trash2 className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog เพิ่ม/แก้ไข */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editTrip ? "แก้ไขเที่ยวรถ" : "เพิ่มเที่ยวรถใหม่"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ต้นทาง</Label>
                  <Select value={form.origin} onValueChange={v => setForm({ ...form, origin: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกต้นทาง" /></SelectTrigger>
                    <SelectContent>{THAI_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>ปลายทาง</Label>
                  <Select value={form.destination} onValueChange={v => setForm({ ...form, destination: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกปลายทาง" /></SelectTrigger>
                    <SelectContent>{THAI_PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>วันที่เดินทาง</Label>
                  <Input type="date" className="mt-1" value={form.travel_date}
                    onChange={e => setForm({ ...form, travel_date: e.target.value })} />
                </div>
                <div>
                  <Label>ประเภทรถ</Label>
                  <Select value={form.bus_type} onValueChange={v => setForm({ ...form, bus_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ปกติ">ปกติ</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="สองชั้น">สองชั้น</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>เวลาออก</Label>
                  <Input type="time" className="mt-1" value={form.departure_time}
                    onChange={e => setForm({ ...form, departure_time: e.target.value })} />
                </div>
                <div>
                  <Label>เวลาถึง</Label>
                  <Input type="time" className="mt-1" value={form.arrival_time}
                    onChange={e => setForm({ ...form, arrival_time: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>ราคา (บาท)</Label>
                  <Input type="number" className="mt-1" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} placeholder="550" />
                </div>
                <div>
                  <Label>จำนวนที่นั่ง</Label>
                  <Input type="number" className="mt-1" value={form.total_seats}
                    onChange={e => setForm({ ...form, total_seats: e.target.value })}
                    disabled={!!editTrip} />
                </div>
                <div>
                  <Label>รหัสรถ</Label>
                  <Input className="mt-1" value={form.bus_code}
                    onChange={e => setForm({ ...form, bus_code: e.target.value })} placeholder="VIP-01" />
                </div>
              </div>
              {editTrip && (
                <div>
                  <Label>สถานะ</Label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">เปิดจอง</SelectItem>
                      <SelectItem value="full">เต็ม</SelectItem>
                      <SelectItem value="cancelled">ยกเลิก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default ScheduleManagement;
