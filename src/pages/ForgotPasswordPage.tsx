import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/lib/api";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 6) return setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
    if (newPassword !== confirmPassword) return setError("รหัสผ่านใหม่ไม่ตรงกัน");
    try {
      setIsSubmitting(true);
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
    <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-lg">
      <div className="mb-6 flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary"><Bus className="h-6 w-6 text-primary-foreground" /></div><div><h1 className="text-xl font-bold text-foreground">ลืมรหัสผ่าน</h1><p className="text-sm text-muted-foreground">ตั้งรหัสผ่านใหม่เพื่อเข้าใช้งานบัญชี</p></div></div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label htmlFor="reset-email">อีเมล</Label><Input id="reset-email" type="email" className="mt-1" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><Label htmlFor="new-password">รหัสผ่านใหม่</Label><div className="relative mt-1"><Input id="new-password" type={showPassword ? "text" : "password"} minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /><button type="button" aria-label="แสดงรหัสผ่าน" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        <div><Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label><div className="relative mt-1"><Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /><button type="button" aria-label="แสดงการยืนยันรหัสผ่าน" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}{message && <p className="text-sm font-medium text-green-600">{message}</p>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}</Button>
      </form>
      <Link to="/login" className="mt-5 flex items-center justify-center gap-2 text-sm text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> กลับไปหน้าเข้าสู่ระบบ</Link>
    </div>
  </div>;
};

export default ForgotPasswordPage;
