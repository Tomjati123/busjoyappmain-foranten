import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/lib/api";
import useAuth from "@/hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState(""); // ใช้รับค่า อีเมล
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const apiUrl = getApiBaseUrl() || "http://localhost:5000";

  const roleFromQuery = new URLSearchParams(location.search).get("role");
  const isStaffLogin = roleFromQuery === "staff";

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setUsername(rememberedEmail);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError("");
      setIsSubmitting(true);

      // 📍 [แก้ไข 1] เปลี่ยน URL ให้ตรงกับ Backend (/api/auth/login)
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // 📍 [แก้ไข 2] ส่ง field 'email' แทน 'identifier' ให้ตรงกับ authController.js
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }

      if (rememberMe && username) {
        localStorage.setItem("rememberedEmail", username);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      if (data.token && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token); // แนะนำบันทึก JWT Token ไว้ใช้งานต่อ
        login(data);
        return;
      }

      setError("ไม่สามารถเข้าสู่ระบบได้ โปรดลองอีกครั้ง");
    } catch (error) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 rounded-xl overflow-hidden shadow-lg">
        {/* Left: System Identity */}
        <div className="bg-secondary text-secondary-foreground p-8 md:p-12 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6">
            <Bus className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">ระบบจองตั๋วรถทัวร์ออนไลน์</h1>
          <p className="text-sm opacity-80 mb-6">Online Bus Ticket Booking System</p>
          <div className="w-16 h-0.5 bg-primary-foreground/30 mb-6" />
          <p className="text-xs opacity-60">มหาวิทยาลัยราชภัฏมหาสารคาม</p>
          <p className="text-xs opacity-60">คณะวิทยาศาสตร์และเทคโนโลยี</p>
        </div>

        {/* Right: Login Form */}
        <div className="bg-card p-8 md:p-12">
          <h2 className="text-xl font-bold text-foreground mb-1">
            {isStaffLogin ? "เข้าสู่ระบบพนักงาน" : "เข้าสู่ระบบ"}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isStaffLogin
              ? "กรอกอีเมลและรหัสผ่านพนักงานเพื่อตรวจสอบและสแกนตั๋ว"
              : "กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน"}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-foreground">อีเมล</Label>
              <Input
                id="username"
                type="email"
                placeholder="example@email.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-foreground">รหัสผ่าน</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border"
                />
                จำฉันไว้
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">ลืมรหัสผ่าน?</Link>
            </div>

            {error && <p className="text-sm text-destructive font-medium">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ยังไม่มีบัญชี?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">สมัครสมาชิก</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
