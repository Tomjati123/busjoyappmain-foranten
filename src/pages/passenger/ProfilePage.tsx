import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, MapPin, Calendar, ArrowLeft, Save, LogOut, MessageCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBaseUrl } from "@/lib/api";
import { getUser, logout } from "@/hooks/useAuth";
import liff from "@line/liff";

const apiUrl = getApiBaseUrl();
const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID;
const isValidLiffId = (value?: string) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === "replace_with_your_liff_id") return false;
  return true;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liffInitPromiseRef = useRef<Promise<boolean> | null>(null);
  const [user, setUser] = useState<any>(getUser());
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    gender: user?.gender || "",
    address: user?.address || "",
    age: user?.age || 0,
    picture_url: user?.picture_url || "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("ขนาดรูปภาพต้องไม่เกิน 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, picture_url: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const linkLineToBackend = async (lineUserId: string, pictureUrl: string | null = null) => {
    try {
      const token = localStorage.getItem("token");
      console.log("[LINE Link] payload ready", {
        lineUserId,
        pictureUrl,
        apiUrl,
      });
      const response = await fetch(
        "http://localhost:5000/api/users/profile/link-line",
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          line_user_id: lineUserId,
          picture_url: pictureUrl
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("✅ เชื่อมต่อบัญชี LINE เรียบร้อยแล้ว");
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setForm(prev => ({
          ...prev,
          picture_url: data.user.picture_url || prev.picture_url
        }));

        // ลบ query param ออกจาก URL โดยไม่ reload
        window.history.replaceState({}, "", "/profile");
        return true;
      } else {
        console.error("[LINE Link] API rejected request", {
          status: response.status,
          message: data.message,
        });
        setError(data.message || "เชื่อมต่อ LINE ไม่สำเร็จ");
        return false;
      }
    } catch (err) {
      console.error("Link Line API Error:", err);
      setError("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
      return false;
    }
  };

  const ensureLiffInitialized = async () => {
    if (liffInitPromiseRef.current) {
      return liffInitPromiseRef.current;
    }

    const liffId = LIFF_ID?.trim();
    if (!isValidLiffId(liffId)) {
      setError("ยังไม่ได้ตั้งค่า VITE_LINE_LIFF_ID");
      return false;
    }

    liffInitPromiseRef.current = liff
      .init({ liffId })
      .then(() => true)
      .catch((err) => {
        console.error("LIFF Init Error:", err);
        setError("เกิดข้อผิดพลาดในการเริ่มต้น LINE กรุณาลองใหม่อีกครั้ง");
        return false;
      })
      .finally(() => {
        liffInitPromiseRef.current = null;
      });

    return liffInitPromiseRef.current;
  };

  // ✅ Main Effect: init LIFF และตรวจว่า LINE redirect กลับมาหรือเปล่า
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const initAndCheck = async () => {
      try {
        const initialized = await ensureLiffInitialized();
        if (!initialized) {
          return;
        }

        // ตรวจว่า LINE เพิ่ง redirect กลับมาหรือเปล่า (มี access token แล้ว)
        if (liff.isLoggedIn() && !user?.line_user_id) {
          setIsLinking(true);
          setSuccess("กำลังเชื่อมต่อ LINE...");
          try {
            console.log("[LINE Link] auto-return detected", { apiUrl });
            const profile = await liff.getProfile();
            console.log("LINE Profile:", profile);
            console.log("LINE User ID:", profile.userId);
            await linkLineToBackend(profile.userId, profile.pictureUrl || null);
          } finally {
            setIsLinking(false);
          }
        }
      } catch (err) {
        console.error("LIFF Init Error:", err);
      }
    };

    initAndCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectLine = async () => {
    console.log("BUTTON CLICKED");
    setError("");
    setSuccess("");
    setIsLinking(true);

    try {
      console.log("START LIFF INIT");

      const initialized = await ensureLiffInitialized();
      if (!initialized) {
        setIsLinking(false);
        return;
      }

      console.log("LIFF INIT SUCCESS");
      console.log("LOGIN STATUS =", liff.isLoggedIn());

      if (!liff.isLoggedIn()) {
        console.log("CALLING LINE LOGIN");
        liff.login({
          redirectUri: window.location.href,
        });
        return;
      }

      console.log("GETTING PROFILE");

      const profile = await liff.getProfile();
      console.log("PROFILE =", profile);
      console.log("LINE Profile:", profile);
      console.log("LINE User ID:", profile.userId);

      if (!profile.userId) {
        throw new Error("ไม่พบ LINE User ID");
      }

      console.log("SENDING TO BACKEND");
      console.log("[LINE Link] button clicked while logged in", { apiUrl });
      await linkLineToBackend(profile.userId, profile.pictureUrl || null);
    } catch (err) {
      console.error("LIFF Error:", err);
      console.error("ERROR =", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ LINE กรุณาลองใหม่อีกครั้ง");
      setIsLinking(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("อัปเดตข้อมูลโปรไฟล์สำเร็จ");
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else if (response.status === 401 || response.status === 403) {
        setError(data.message || "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
        logout("/login");
      } else {
        setError(data.message || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
      }
    } catch (err) {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-primary" /> โปรไฟล์ของฉัน
          </h1>
        </div>

        <Card>
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border border-border">
                  {form.picture_url ? (
                    <img src={form.picture_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-primary" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-3 h-3" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <CardTitle className="text-xl">{user?.username}</CardTitle>
                <p className="text-sm text-muted-foreground">สมาชิก Bus Joy</p>
                {user?.line_user_id ? (
                  <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold flex items-center gap-1 mt-1 w-fit">
                    <MessageCircle className="w-2 h-2" /> เชื่อมต่อ LINE แล้ว
                  </span>
                ) : (
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold flex items-center gap-1 mt-1 w-fit">
                    ยังไม่ได้เชื่อมต่อ LINE
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
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
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">อายุ</Label>
                  <Input
                    id="age"
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">เพศ</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(value) => setForm({ ...form, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ชาย</SelectItem>
                      <SelectItem value="female">หญิง</SelectItem>
                      <SelectItem value="other">อื่น ๆ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">ที่อยู่</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  required
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-success font-medium">{success}</p>}

              {!user?.line_user_id && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10"
                    onClick={handleConnectLine}
                    disabled={isLinking}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {isLinking ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อกับ LINE เพื่อรับการแจ้งเตือน"}
                  </Button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving ? "กำลังบันทึก..." : <><Save className="w-4 h-4 mr-2" /> บันทึกการเปลี่ยนแปลง</>}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => logout("/login")}
                >
                  <LogOut className="w-4 h-4 mr-2" /> ออกจากระบบ
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
