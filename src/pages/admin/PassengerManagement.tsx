import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Key, Search, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBaseUrl } from "@/lib/api";

type Passenger = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  gender: string;
  address: string;
  age: number;
  is_active: boolean;
};

const PassengerManagement = () => {
  const apiUrl = getApiBaseUrl();
  const [search, setSearch] = useState("");
  const [passengers, setPassengers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPassenger, setEditPassenger] = useState<Passenger | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    gender: "",
    address: "",
    age: 0,
    password: "", // Only for adding new passenger
    is_active: true, // Default for new passenger
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("Error: No authentication token found. Please log in.");
        setError("เซสชันหมดอายุหรือไม่มี Token กรุณาเข้าสู่ระบบใหม่");
        setLoading(false);
        return;
      }

      console.log("Fetching passengers with token:", token); // Log the token being sent
      const response = await fetch(
        `${apiUrl}/api/passengers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await response.json();

      if (response.ok) {
        // รองรับทั้งกรณีส่งเป็น Array โดยตรง หรือห่อหุ้มใน Object
        const passengersData = Array.isArray(data) ? data : (data.passengers || data.data || []);
        setPassengers(passengersData);
      } else {
        // จัดการกรณี 403 Forbidden หรือ Error อื่นๆ จาก Backend
        console.error(`API Error (${response.status}) on fetching passengers:`, data);
        setError(data.message || `เกิดข้อผิดพลาด (${response.status})`);
      }
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถดึงข้อมูลได้ โปรดตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const openAddPassenger = () => {
    setEditPassenger(null);
    setForm({
      full_name: "",
      username: "",
      email: "",
      gender: "",
      address: "",
      age: 0,
      password: "",
      is_active: true,
    });
    setError(null);
    setDialogOpen(true);
  };

  const openEditPassenger = (passenger: Passenger) => {
    setEditPassenger(passenger);
    setForm({
      full_name: passenger.full_name,
      username: passenger.username,
      email: passenger.email,
      gender: passenger.gender,
      address: passenger.address,
      age: passenger.age,
      password: "", // Password is not pre-filled for security reasons
      is_active: passenger.is_active,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSavePassenger = async () => {
    if (!form.full_name || !form.username || !form.email || !form.gender || !form.address || form.age <= 0) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง");
      return;
    }
    if (!editPassenger && !form.password) { // Password is required for new passenger
      setError("กรุณากรอกรหัสผ่านสำหรับผู้โดยสารใหม่");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const token = localStorage.getItem("token");
      if (!token) { setError("ไม่มี Token สำหรับการยืนยันตัวตน"); setIsSaving(false); return; }

      const method = editPassenger ? "PUT" : "POST";
      const url = editPassenger
        ? `${apiUrl}/api/passengers/${editPassenger.id}`
        : `${apiUrl}/api/passengers`;

      const payload: any = {
        full_name: form.full_name,
        username: form.username,
        email: form.email,
        gender: form.gender,
        address: form.address,
        age: Number(form.age),
        is_active: form.is_active,
      };
      if (!editPassenger) { // Only send password for new user creation
        payload.password = form.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setDialogOpen(false);
        fetchPassengers();
      } else {
        console.error(`API Error (${response.status}) on saving passenger:`, data);
        setError(data.message || `เกิดข้อผิดพลาด (${response.status})`);
      }
    } catch (err) {
      setError("ไม่สามารถบันทึกข้อมูลได้ โปรดตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePassengerStatus = async (id: number, currentStatus: boolean) => {
    const action = currentStatus ? "ปิดการใช้งาน" : "เปิดใช้งาน";
    if (!window.confirm(`ยืนยันการ${action}ผู้โดยสารท่านนี้?`)) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("ไม่มี Token สำหรับการยืนยันตัวตน"); return; }

      const res = await fetch(`${apiUrl}/api/passengers/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        fetchPassengers();
      } else {
        console.error(`API Error (${res.status}) on toggling passenger status:`, await res.json());
        const data = await res.json();
        alert(data.message || `ไม่สามารถ${action}ผู้โดยสารได้`);
      }
    } catch (error) {
      console.error(error);
      alert(`เกิดข้อผิดพลาดในการ${action}ผู้โดยสาร`);
    }
  };

  const resetPassword = async (id: number) => {
    if (!window.confirm("รีเซ็ตรหัสผ่านเป็น 123456?")) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) { alert("ไม่มี Token สำหรับการยืนยันตัวตน"); return; }

      const res = await fetch(`${apiUrl}/api/passengers/${id}/reset-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        alert("รีเซ็ตรหัสผ่านสำเร็จ");
      } else {
        console.error(`API Error (${res.status}) on resetting password:`, await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = passengers.filter((p: any) => {
    const searchTerm = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(searchTerm) ||
      p.email?.toLowerCase().includes(searchTerm) ||
      p.username?.toLowerCase().includes(searchTerm)
    );
  }
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          กำลังโหลดข้อมูล...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">จัดการข้อมูลผู้โดยสาร</h1>
          <Button onClick={openAddPassenger}><UserPlus className="w-4 h-4 mr-1" />เพิ่มผู้โดยสาร</Button>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="ค้นหาผู้โดยสาร..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>อีเมล</TableHead>
                    <TableHead>เพศ</TableHead>
                    <TableHead>อายุ (ปี)</TableHead>
                    <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      ไม่พบข้อมูลผู้โดยสาร
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.id}</TableCell>
                    <TableCell className="font-medium">{p.full_name}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.gender || "-"}</TableCell>
                    <TableCell>{p.age}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {p.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditPassenger(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resetPassword(p.id)} title="รีเซ็ตรหัสผ่าน">
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => togglePassengerStatus(p.id, p.is_active)} title={p.is_active ? "ปิดการใช้งาน" : "เปิดใช้งาน"}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog เพิ่ม/แก้ไขผู้โดยสาร */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editPassenger ? "แก้ไขข้อมูลผู้โดยสาร" : "เพิ่มผู้โดยสารใหม่"}</DialogTitle>
              <DialogDescription>
                {editPassenger ? "แก้ไขรายละเอียดของผู้โดยสารในระบบ" : "กรอกข้อมูลเพื่อลงทะเบียนผู้โดยสารใหม่"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right">
                  ชื่อ-นามสกุล
                </Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  ชื่อผู้ใช้
                </Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  อีเมล
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="gender" className="text-right">
                  เพศ
                </Label>
                <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="เลือกเพศ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ชาย</SelectItem>
                    <SelectItem value="female">หญิง</SelectItem>
                    <SelectItem value="other">อื่น ๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="age" className="text-right">
                  อายุ
                </Label>
                <Input
                  id="age"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  ที่อยู่
                </Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              {!editPassenger && ( // Password input only for new passenger
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">รหัสผ่าน</Label>
                  <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="col-span-3" required />
                </div>
              )}
              {error && <p className="col-span-4 text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" onClick={handleSavePassenger} disabled={isSaving}>
                {isSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PassengerManagement;
