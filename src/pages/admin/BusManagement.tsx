import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Grid3X3, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const buses = [
  { id: 1, number: "VIP-01", type: "VIP", seats: 32, status: "พร้อมใช้งาน" },
  { id: 2, number: "VIP-02", type: "VIP", seats: 32, status: "พร้อมใช้งาน" },
  { id: 3, number: "STD-01", type: "ปกติ", seats: 40, status: "พร้อมใช้งาน" },
  { id: 4, number: "STD-02", type: "ปกติ", seats: 40, status: "ซ่อมบำรุง" },
  { id: 5, number: "STD-03", type: "ปกติ", seats: 40, status: "พร้อมใช้งาน" },
  { id: 6, number: "DBL-01", type: "สองชั้น", seats: 48, status: "พร้อมใช้งาน" },
];

const BusManagement = () => {
  const [search, setSearch] = useState("");
  const filtered = buses.filter(b => b.number.includes(search) || b.type.includes(search));

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">จัดการรถทัวร์และที่นั่ง</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-1" />เพิ่มรถใหม่</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>เพิ่มรถใหม่</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label className="text-foreground">หมายเลขรถ</Label><Input className="mt-1" /></div>
                <div><Label className="text-foreground">ประเภทรถ</Label><Input className="mt-1" placeholder="VIP / ปกติ / สองชั้น" /></div>
                <div><Label className="text-foreground">จำนวนที่นั่ง</Label><Input type="number" className="mt-1" /></div>
                <Button className="w-full">บันทึก</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="ค้นหารถ..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>หมายเลขรถ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>จำนวนที่นั่ง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{b.id}</TableCell>
                    <TableCell className="font-medium">{b.number}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.type === "VIP" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{b.type}</span>
                    </TableCell>
                    <TableCell>{b.seats}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${b.status === "พร้อมใช้งาน" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>{b.status}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" className="text-primary"><Grid3X3 className="w-4 h-4" /></Button>
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

export default BusManagement;
