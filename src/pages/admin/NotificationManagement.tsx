import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, CheckCircle, RefreshCw, Send, UserRound } from "lucide-react";
import { getApiBaseUrl } from "@/lib/api";

type Notification = { id: number; title: string; message: string; created_at: string; recipient: string };

const NotificationManagement = () => {
  const apiUrl = getApiBaseUrl() || "http://localhost:5000";
  const [history, setHistory] = useState<Notification[]>([]);
  const [lineUserId, setLineUserId] = useState("");
  const [title, setTitle] = useState("ข้อความจากผู้ดูแลระบบ");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` };

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/admin/notifications`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ไม่สามารถโหลดประวัติได้");
      setHistory(Array.isArray(data) ? data : []); setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "ไม่สามารถโหลดประวัติได้"); }
    finally { setLoading(false); }
  }, [apiUrl]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const sendNotification = async () => {
    if (!lineUserId.trim() || !message.trim()) { setError("กรุณากรอก LINE User ID และข้อความให้ครบถ้วน"); return; }
    try {
      setSending(true); setError(""); setSuccess("");
      const response = await fetch(`${apiUrl}/api/admin/notifications/test`, { method: "POST", headers, body: JSON.stringify({ lineUserId: lineUserId.trim(), title, message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "ส่งแจ้งเตือนไม่สำเร็จ");
      setSuccess(data.warning || `ส่งแจ้งเตือนให้ ${data.recipient} และบันทึกเข้าระบบแล้ว`); setMessage(""); await loadHistory();
    } catch (err) { setError(err instanceof Error ? err.message : "ส่งแจ้งเตือนไม่สำเร็จ"); }
    finally { setSending(false); }
  };
  const formatDate = (value: string) => new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return <AdminLayout><div className="p-6 space-y-6">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-foreground">จัดการแจ้งเตือน</h1><p className="text-sm text-muted-foreground mt-1">ส่งข้อความถึงผู้โดยสารที่เชื่อมต่อ LINE แล้ว</p></div><Button variant="outline" onClick={loadHistory} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />รีเฟรช</Button></div>
    {(error || success) && <div className={`rounded-md px-4 py-3 text-sm ${error ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}>{error || success}</div>}
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="w-5 h-5 text-primary" />ส่งแจ้งเตือน</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4"><div><Label>LINE User ID</Label><Input className="mt-1" value={lineUserId} onChange={(e) => setLineUserId(e.target.value)} placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></div><div><Label>หัวข้อ</Label><Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} /></div></div>
      <div><Label>ข้อความ</Label><Input className="mt-1" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendNotification(); }} placeholder="พิมพ์ข้อความแจ้งเตือน..." maxLength={2000} /></div><Button onClick={sendNotification} disabled={sending}><Send className="w-4 h-4 mr-2" />{sending ? "กำลังส่ง..." : "ส่งแจ้งเตือน"}</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-5 h-5" />ประวัติการแจ้งเตือน ({history.length})</CardTitle></CardHeader><CardContent className="p-0 overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>หัวข้อ / ข้อความ</TableHead><TableHead>ผู้รับ</TableHead><TableHead>วันที่</TableHead><TableHead>สถานะ</TableHead></TableRow></TableHeader><TableBody>
      {loading ? <TableRow><TableCell colSpan={5} className="text-center py-8">กำลังโหลด...</TableCell></TableRow> : history.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ยังไม่มีประวัติการแจ้งเตือน</TableCell></TableRow> : history.map((item) => <TableRow key={item.id}><TableCell>{item.id}</TableCell><TableCell><div className="font-medium">{item.title}</div><div className="text-sm text-muted-foreground max-w-md truncate">{item.message}</div></TableCell><TableCell><div className="flex items-center gap-2"><UserRound className="w-4 h-4 text-muted-foreground" />{item.recipient}</div></TableCell><TableCell className="text-sm whitespace-nowrap">{formatDate(item.created_at)}</TableCell><TableCell><span className="flex items-center gap-1 text-success text-xs"><CheckCircle className="w-3 h-3" />บันทึกแล้ว</span></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div></AdminLayout>;
};
export default NotificationManagement;
