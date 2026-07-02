import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send, MessageCircle, CheckCircle, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const notificationHistory = [
  { id: 1, type: "จองสำเร็จ", recipient: "สมชาย ใจดี", channel: "LINE", date: "15 มี.ค. 2569 08:30", status: "ส่งสำเร็จ" },
  { id: 2, type: "แจ้งเตือนเดินทาง", recipient: "สมหญิง รักสวย", channel: "LINE", date: "14 มี.ค. 2569 20:00", status: "ส่งสำเร็จ" },
  { id: 3, type: "ยกเลิกการจอง", recipient: "ประเสริฐ มั่งมี", channel: "อีเมล", date: "13 มี.ค. 2569 15:45", status: "ล้มเหลว" },
  { id: 4, type: "จองสำเร็จ", recipient: "วิภา สุขใจ", channel: "LINE", date: "12 มี.ค. 2569 10:00", status: "ส่งสำเร็จ" },
];

const NotificationManagement = () => (
  <AdminLayout>
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-6">จัดการแจ้งเตือนสถานะ</h1>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* LINE Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-success" />ตั้งค่าแจ้งเตือน LINE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">แจ้งเตือนการจองสำเร็จ</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-foreground">แจ้งเตือนก่อนเดินทาง</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-foreground">แจ้งเตือนการยกเลิก</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-foreground">แจ้งเตือนคืนเงิน</Label>
              <Switch />
            </div>
            <div>
              <Label className="text-foreground">LINE Channel Token</Label>
              <Input className="mt-1" type="password" defaultValue="xxxxxxxxxx" />
            </div>
          </CardContent>
        </Card>

        {/* Test */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />ทดสอบส่งแจ้งเตือน
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><Label className="text-foreground">LINE User ID</Label><Input className="mt-1" placeholder="Uxxxxxxxxxxxxxxxxx" /></div>
            <div><Label className="text-foreground">ข้อความ</Label><Input className="mt-1" placeholder="ทดสอบการแจ้งเตือน" /></div>
            <Button><Send className="w-4 h-4 mr-1" />ส่งทดสอบ</Button>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-5 h-5" />ประวัติการส่งแจ้งเตือน
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>ผู้รับ</TableHead>
                <TableHead>ช่องทาง</TableHead>
                <TableHead>วันที่ส่ง</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notificationHistory.map(n => (
                <TableRow key={n.id}>
                  <TableCell>{n.id}</TableCell>
                  <TableCell className="font-medium">{n.type}</TableCell>
                  <TableCell>{n.recipient}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${n.channel === "LINE" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}>
                      {n.channel}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{n.date}</TableCell>
                  <TableCell>
                    {n.status === "ส่งสำเร็จ" ? (
                      <span className="flex items-center gap-1 text-success text-xs"><CheckCircle className="w-3 h-3" />{n.status}</span>
                    ) : (
                      <span className="flex items-center gap-1 text-destructive text-xs"><XCircle className="w-3 h-3" />{n.status}</span>
                    )}
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

export default NotificationManagement;
