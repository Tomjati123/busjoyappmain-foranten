import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Route = {
  id: number;
  route_name: string;
  start_location: string;
  end_location: string;
  distance: number;
  status: string;
};

const emptyForm = { route_name: "", start_location: "", end_location: "", distance: 0, status: "active" };

const RouteManagement = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRoute, setEditRoute] = useState<Route | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5000/api/routes", { headers });
      const data = await res.json();
      setRoutes(Array.isArray(data) ? data : []);
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRoutes(); }, []);

  const openAdd = () => {
    setEditRoute(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (route: Route) => {
    setEditRoute(route);
    setForm({
      route_name: route.route_name,
      start_location: route.start_location,
      end_location: route.end_location,
      distance: route.distance,
      status: route.status,
    });
    setError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.route_name || !form.start_location || !form.end_location) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    try {
      setIsSaving(true);
      setError("");
      const url = editRoute
        ? `http://localhost:5000/api/routes/${editRoute.id}`
        : "http://localhost:5000/api/routes";
      const method = editRoute ? "PUT" : "POST";
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setDialogOpen(false);
      fetchRoutes();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันการลบเส้นทางนี้?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/routes/${id}`, { method: "DELETE", headers });
      const data = await res.json();
      if (!res.ok) { alert(data.message); return; }
      fetchRoutes();
    } catch {
      alert("ลบไม่สำเร็จ");
    }
  };

  const filtered = routes.filter(r =>
    r.route_name?.includes(search) ||
    r.start_location?.includes(search) ||
    r.end_location?.includes(search)
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">จัดการเส้นทาง</h1>
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-1" />เพิ่มเส้นทางใหม่</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="ค้นหาเส้นทาง..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>ชื่อเส้นทาง</TableHead>
                    <TableHead>ต้นทาง</TableHead>
                    <TableHead>ปลายทาง</TableHead>
                    <TableHead>ระยะทาง (กม.)</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">ไม่พบข้อมูลเส้นทาง</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(r => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell className="font-medium">{r.route_name}</TableCell>
                        <TableCell>{r.start_location}</TableCell>
                        <TableCell>{r.end_location}</TableCell>
                        <TableCell>{r.distance} กม.</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            r.status === "active" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                          }`}>
                            {r.status === "active" ? "เปิดใช้งาน" : "ปิดปรับปรุง"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog เพิ่ม/แก้ไข */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editRoute ? "แก้ไขเส้นทาง" : "เพิ่มเส้นทางใหม่"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-foreground">ชื่อเส้นทาง</Label>
                <Input className="mt-1" value={form.route_name}
                  onChange={e => setForm({ ...form, route_name: e.target.value })}
                  placeholder="เช่น กรุงเทพ-เชียงใหม่" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground">ต้นทาง</Label>
                  <Input className="mt-1" value={form.start_location}
                    onChange={e => setForm({ ...form, start_location: e.target.value })}
                    placeholder="เช่น กรุงเทพมหานคร" />
                </div>
                <div>
                  <Label className="text-foreground">ปลายทาง</Label>
                  <Input className="mt-1" value={form.end_location}
                    onChange={e => setForm({ ...form, end_location: e.target.value })}
                    placeholder="เช่น เชียงใหม่" />
                </div>
              </div>
              <div>
                <Label className="text-foreground">ระยะทาง (กม.)</Label>
                <Input type="number" className="mt-1" value={form.distance}
                  onChange={e => setForm({ ...form, distance: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-foreground">สถานะ</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">เปิดใช้งาน</SelectItem>
                    <SelectItem value="inactive">ปิดปรับปรุง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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

export default RouteManagement;