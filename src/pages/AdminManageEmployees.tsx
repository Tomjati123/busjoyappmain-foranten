import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Shield, Loader2, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type Employee = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
};

const AdminManageEmployees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    role: "staff",
    password: "",
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter((emp) =>
    emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.username.toLowerCase().includes(search.toLowerCase()) ||
    emp.role.toLowerCase().includes(search.toLowerCase())
  );

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("เซสชันหมดอายุหรือไม่มี Token กรุณาเข้าสู่ระบบใหม่");
        return;
      }
      
      const response = await fetch("http://localhost:5000/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        setError(null); // Clear any previous errors
      } else {
        const data = await response.json();
        setError(data.message || "ไม่สามารถดึงข้อมูลพนักงานได้");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("ไม่สามารถดึงข้อมูลพนักงานได้");
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openAddEmployee = () => {
    setEditEmployee(null);
    setForm({
      full_name: "",
      username: "",
      email: "",
      role: "staff",
      password: "",
      is_active: true,
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditEmployee = (employee: Employee) => {
    setEditEmployee(employee);
    setForm({
      full_name: employee.full_name,
      username: employee.username,
      email: employee.email,
      role: employee.role,
      password: "", // Password is not pre-filled for security reasons
      is_active: employee.is_active,
    });
    setError(null);
    setIsDialogOpen(true);
  };

  // This function will now perform a hard delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้อย่างถาวร? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) return;

    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("ไม่มี Token สำหรับการยืนยันตัวตน");
        return;
      }
      // Check if the user is trying to deactivate their own account
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id === id) {
        setError("ไม่สามารถลบบัญชีที่คุณกำลังใช้งานอยู่ได้");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("ลบพนักงานเรียบร้อยแล้ว");
        fetchEmployees();
      } else {
        const data = await response.json();
        setError(data.message || "ไม่สามารถลบข้อมูลพนักงานได้");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name || !form.username || !form.email || !form.role) {
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    if (!editEmployee && !form.password) {
      setError("กรุณากรอกรหัสผ่านสำหรับพนักงานใหม่");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("ไม่มี Token สำหรับการยืนยันตัวตน");
        setIsSaving(false);
        return;
      }

      const method = editEmployee ? "PUT" : "POST"; // กำหนด method ให้ถูกต้อง
      const url = editEmployee ? `http://localhost:5000/api/employees/${editEmployee.id}` : "http://localhost:5000/api/employees";

      const payload: any = { ...form };
      if (editEmployee && !form.password) { // Don't send empty password on edit if not changed
        delete payload.password;
      }

      const response = await fetch(url, {
        method: method, // ใช้ method ที่กำหนดไว้
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "ไม่สามารถเพิ่มพนักงานได้");
        return;
      }

      alert(editEmployee ? "แก้ไขข้อมูลพนักงานสำเร็จ" : "เพิ่มพนักงานสำเร็จแล้ว"); // ใช้ alert ชั่วคราว
      setForm({
        full_name: "", username: "", email: "", role: "staff", password: "", is_active: true,
      });
      setIsDialogOpen(false);
      fetchEmployees();
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally { // Always reset saving state
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">จัดการพนักงาน</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddEmployee}>
                <UserPlus className="w-4 h-4 mr-2" /> เพิ่มพนักงานใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}</DialogTitle>
                <DialogDescription>
                  {editEmployee ? "แก้ไขรายละเอียดของพนักงานในระบบ" : "กรอกข้อมูลเพื่อเพิ่มพนักงานใหม่เข้าสู่ระบบ"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveEmployee} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                  <Input id="fullName" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required placeholder="สมชาย ใจดี" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required placeholder="staff_01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="staff@busjoy.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff (พนักงาน)</SelectItem>
                      <SelectItem value="admin">Admin (ผู้ดูแลระบบ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!editEmployee && ( // Password is required only for new employees
                  <div className="space-y-2">
                    <Label htmlFor="password">รหัสผ่าน</Label>
                    <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editEmployee} placeholder="••••••••" />
                  </div>
                )}
                {editEmployee && ( // Allow changing active status for existing employees
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="is_active">สถานะการใช้งาน</Label>
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    />
                  </div>
                )}
                {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editEmployee ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="ค้นหาพนักงาน..." 
                  className="pl-9" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ-นามสกุล / Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>เข้าใช้งานล่าสุด</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((emp: any) => (
                  <TableRow key={emp.id}>
                    <TableCell className={!emp.is_active ? "text-muted-foreground" : ""}>
                      <div>
                        <p className="font-medium">{emp.full_name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{emp.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${emp.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'} ${!emp.is_active ? "opacity-50" : ""}`}>
                        {emp.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {emp.last_login || "ยังไม่เคยเข้าใช้"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditEmployee(emp)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(emp.id)} title="ลบพนักงาน">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};
export default AdminManageEmployees;