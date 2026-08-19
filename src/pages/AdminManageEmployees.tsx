import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Shield, Loader2, Pencil, Trash2, Search, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "@/components/AdminLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api";

type Employee = {
  id: number;
  full_name?: string;
  fullName?: string;
  username: string;
  email: string;
  role: string;
  is_active?: boolean;
  isActive?: boolean;
  last_login?: string | null;
  created_at?: string;
};

const AdminManageEmployees = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    fullName: "",
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

  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  // ดึงชื่อจริงไม่ว่าจะอยู่ในรูป full_name หรือ fullName
  const getName = (emp: Employee) => emp.fullName || emp.full_name || "ไม่ระบุชื่อ";
  const getIsActive = (emp: Employee) => emp.isActive !== undefined ? emp.isActive : (emp.is_active !== undefined ? emp.is_active : true);

  const filteredEmployees = employees.filter((emp) => {
    const name = getName(emp).toLowerCase();
    const email = (emp.email || "").toLowerCase();
    const username = (emp.username || "").toLowerCase();
    const role = (emp.role || "").toLowerCase();
    const query = search.toLowerCase();

    return name.includes(query) || email.includes(query) || username.includes(query) || role.includes(query);
  });

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("เซสชันหมดอายุหรือไม่มี Token กรุณาเข้าสู่ระบบใหม่");
        return;
      }
      
      const response = await fetch(`${apiUrl}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : data.employees || []);
        setError(null);
      } else {
        const data = await response.json();
        setError(data.message || data.error || "ไม่สามารถดึงข้อมูลพนักงานได้");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("ไม่สามารถดึงข้อมูลพนักงานได้ โปรดตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  useEffect(() => { 
    fetchEmployees(); 
  }, []);

  const openAddEmployee = () => {
    setEditEmployee(null);
    setForm({
      fullName: "",
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
      fullName: getName(employee),
      username: employee.username || "",
      email: employee.email || "",
      role: employee.role || "staff",
      password: "",
      is_active: getIsActive(employee),
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้อย่างถาวร? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) return;

    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("ไม่มี Token สำหรับการยืนยันตัวตน");
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser.id === id) {
        setError("ไม่สามารถลบบัญชีที่คุณกำลังใช้งานอยู่ได้");
        return;
      }

      const response = await fetch(`${apiUrl}/api/employees/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("ลบพนักงานเรียบร้อยแล้ว");
        fetchEmployees();
      } else {
        const data = await response.json();
        setError(data.message || data.error || "ไม่สามารถลบข้อมูลพนักงานได้");
      }
    } catch (err) {
      console.error("Delete employee error:", err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.username || !form.email || !form.role) {
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

      const method = editEmployee ? "PUT" : "POST";
      const url = editEmployee ? `${apiUrl}/api/employees/${editEmployee.id}` : `${apiUrl}/api/employees`;

      const payload: any = { 
        fullName: form.fullName,
        full_name: form.fullName, // แนบไปทั้งสองแบบรองรับทุกรูปแบบ Controller
        username: form.username,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
        isActive: form.is_active
      };

      if (form.password) {
        payload.password = form.password;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "บันทึกข้อมูลพนักงานไม่สำเร็จ");
        return;
      }

      alert(editEmployee ? "แก้ไขข้อมูลพนักงานสำเร็จ" : "เพิ่มพนักงานสำเร็จแล้ว");
      setIsDialogOpen(false);
      fetchEmployees();
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">จัดการพนักงาน</h1>
              <p className="text-xs text-muted-foreground">เพิ่ม แก้ไข หรือระงับสิทธิ์บัญชีผู้ใช้งานระบบสแกนตั๋ว</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddEmployee} className="gap-2">
                <UserPlus className="w-4 h-4" /> เพิ่มพนักงานใหม่
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
                  <Input 
                    id="fullName" 
                    value={form.fullName} 
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                    required 
                    placeholder="สมชาย ใจดี" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={form.username} 
                    onChange={(e) => setForm({ ...form, username: e.target.value })} 
                    required 
                    placeholder="staff_01" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    required 
                    placeholder="staff@busjoy.com" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff (พนักงานตรวจตั๋ว)</SelectItem>
                      <SelectItem value="admin">Admin (ผู้ดูแลระบบ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    รหัสผ่าน {editEmployee && <span className="text-xs text-muted-foreground font-normal">(เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</span>}
                  </Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    required={!editEmployee} 
                    placeholder="••••••••" 
                  />
                </div>

                {editEmployee && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/40">
                    <Label htmlFor="is_active" className="cursor-pointer">เปิดใช้งานบัญชีนี้</Label>
                    <Switch
                      id="is_active"
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    />
                  </div>
                )}

                {error && <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md font-medium">{error}</p>}

                <Button type="submit" className="w-full mt-2" disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (editEmployee ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* ตารางแสดงรายชื่อพนักงาน */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="ค้นหาชื่อ, username, อีเมล..." 
                  className="pl-9" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ-นามสกุล / อีเมล</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        ไม่พบข้อมูลพนักงาน
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isActive = getIsActive(emp);
                      return (
                        <TableRow key={emp.id} className={!isActive ? "bg-muted/30 opacity-75" : ""}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{getName(emp)}</p>
                              <p className="text-xs text-muted-foreground">{emp.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{emp.username}</TableCell>
                          <TableCell>
                            <Badge variant={emp.role === 'admin' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                              {emp.role === 'admin' ? 'ผู้ดูแลระบบ' : 'พนักงาน'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ใช้งานอยู่
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                                <XCircle className="w-3.5 h-3.5" /> ถูกปิดใช้งาน
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditEmployee(emp)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(emp.id)} title="ลบพนักงาน">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminManageEmployees;