import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bus, Eye, EyeOff, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LINE_OA_URL = "https://lin.ee/Vfy8fjf";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    const passengerProfile = {
      username,
      fullName,
      email,
      gender,
      address,
      age,
    };

    try {
      setError("");
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...passengerProfile,
          password,
        }),
      });

      const data = await response.json();

      console.log("REGISTER RESPONSE:", data);
      console.log("STATUS:", response.status);

      if (!response.ok) {
        setError(data.message || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      // backend now returns `user` (migrated to users table)
      localStorage.setItem("passengerProfile", JSON.stringify(data.user || data.passenger || passengerProfile));
      // แก้ไขการเก็บข้อมูลให้ตรงกับที่ระบบ Auth และหน้าตั๋วต้องการ
      const userData = data.user || data.passenger || { ...passengerProfile, role: 'passenger' };
      localStorage.setItem("user", JSON.stringify(userData));
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      window.open(LINE_OA_URL, "_blank", "noopener,noreferrer");
      navigate("/passenger/tickets");
    } catch (error) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 rounded-xl overflow-hidden shadow-lg">
        <div className="bg-secondary text-secondary-foreground p-8 md:p-12 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6">
            <Bus className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">สมัครสมาชิกผู้โดยสาร</h1>
          <p className="text-sm opacity-80 mb-6">เริ่มจองตั๋วรถทัวร์ออนไลน์ได้ทันที</p>
          <div className="w-16 h-0.5 bg-primary-foreground/30 mb-6" />
          <p className="text-xs opacity-60">Online Bus Ticket Booking System</p>
        </div>

        <div className="bg-card p-8 md:p-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">สร้างบัญชีใหม่</h2>
              <p className="text-sm text-muted-foreground">กรอกข้อมูลเพื่อสมัครใช้งานระบบ</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4 mt-6">
            <div>
              <Label htmlFor="fullName" className="text-foreground">ชื่อ-นามสกุล</Label>
              <Input
                id="fullName"
                placeholder="กรอกชื่อ-นามสกุล"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="username" className="text-foreground">ชื่อผู้ใช้ (username)</Label>
              <Input
                id="username"
                placeholder="ชื่อผู้ใช้สำหรับเข้าสู่ระบบ"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-foreground">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="age" className="text-foreground">อายุ</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="กรอกอายุ"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="gender" className="text-foreground">เพศ</Label>
              <Select value={gender} onValueChange={setGender} required>
                <SelectTrigger id="gender" className="mt-1">
                  <SelectValue placeholder="เลือกเพศ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">ชาย</SelectItem>
                  <SelectItem value="female">หญิง</SelectItem>
                  <SelectItem value="other">อื่น ๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address" className="text-foreground">ที่อยู่</Label>
              <Input
                id="address"
                placeholder="กรอกที่อยู่"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
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
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-foreground">ยืนยันรหัสผ่าน</Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg">
              สมัครสมาชิก
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              มีบัญชีอยู่แล้ว?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
