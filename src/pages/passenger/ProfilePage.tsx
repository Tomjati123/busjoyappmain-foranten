import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, ArrowLeft, Save, LogOut, MessageCircle, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiBaseUrl } from "@/lib/api";
import { getUser, logout } from "@/hooks/useAuth";
import liff from "@line/liff";

const apiUrl = getApiBaseUrl() || "http://localhost:5000";
const LIFF_ID = import.meta.env.VITE_LINE_LIFF_ID;
const LIFF_REDIRECT_URI = import.meta.env.VITE_LINE_LIFF_REDIRECT_URI?.trim();

const isValidLiffId = (value?: string) => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "replace_with_your_liff_id") return false;
  return true;
};

const getLiffRedirectUri = () => {
  if (LIFF_REDIRECT_URI) return LIFF_REDIRECT_URI;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/passenger/profile`;
  }
  return "https://bootleg-duration-helpful.ngrok-free.dev/passenger/profile";
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liffInitPromiseRef = useRef<Promise<boolean> | null>(null);

  const [user, setUser] = useState<any>(getUser());
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    gender: "male",
    address: "",
    age: 0,
    picture_url: "",
  });

  // 1. ดึงข้อมูลโปรไฟล์ล่าสุดจาก Backend เมื่อเริ่มโหลดหน้า
  useEffect(() => {
    const fetchLatestProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoadingProfile(false);
        navigate("/login");
        return;
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 8000);

      try {
        setIsLoadingProfile(true);
        const res = await fetch(`${apiUrl}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (res.ok) {
          const data = await res.json();
          const profileData = data.user || data;
          setUser(profileData);
          setForm({
            full_name: profileData.full_name || profileData.fullName || "",
            email: profileData.email || "",
            gender: profileData.gender || "male",
            address: profileData.address || "",
            age: profileData.age || 0,
            picture_url: profileData.picture_url || profileData.pictureUrl || profileData.avatar || "",
          });
          // Sync กลับลง LocalStorage
          localStorage.setItem("user", JSON.stringify(profileData));
        } else if (res.status === 401 || res.status === 403) {
          logout("/login");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        const cachedUser = getUser();
        if (cachedUser) {
          setUser(cachedUser);
          setForm({
            full_name: cachedUser.full_name || cachedUser.fullName || "",
            email: cachedUser.email || "",
            gender: cachedUser.gender || "male",
            address: cachedUser.address || "",
            age: cachedUser.age || 0,
            picture_url: cachedUser.picture_url || cachedUser.pictureUrl || cachedUser.avatar || "",
          });
        }
        setError(err instanceof DOMException && err.name === "AbortError"
          ? "เซิร์ฟเวอร์ตอบสนองช้า จึงแสดงข้อมูลโปรไฟล์ล่าสุดที่บันทึกไว้"
          : "ไม่สามารถโหลดข้อมูลล่าสุดได้ จึงแสดงข้อมูลโปรไฟล์ที่บันทึกไว้");
      } finally {
        window.clearTimeout(timeoutId);
        setIsLoadingProfile(false);
      }
    };

    fetchLatestProfile();
  }, [navigate]);

  // รับ callback จาก LINE OAuth2 (link mode)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const lineLinked = params.get("line_linked");
    const lineError  = params.get("line_error");

    if (lineLinked === "success") {
      setSuccess("✅ เชื่อมต่อบัญชี LINE เรียบร้อยแล้ว");
      // รีโหลดข้อมูล profile ล่าสุด
      const token = localStorage.getItem("token");
      if (token) {
        fetch(`${apiUrl}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((data) => {
            const p = data.user || data;
            setUser(p);
            localStorage.setItem("user", JSON.stringify(p));
          })
          .catch(() => {});
      }
      window.history.replaceState({}, "", window.location.pathname);
    } else if (lineError) {
      const msgs: Record<string, string> = {
        already_linked: "LINE ID นี้ถูกผูกกับบัญชีอื่นแล้ว",
        token_invalid:  "Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่",
        no_token:       "ไม่พบ Token กรุณาเข้าสู่ระบบใหม่",
      };
      setError(msgs[lineError] || "เชื่อมต่อ LINE ไม่สำเร็จ");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [location.search]);

  // Handle เปลี่ยนไฟล์รูป
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("ขนาดรูปภาพต้องไม่เกิน 2MB");
        return;
      }
      setError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, picture_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 🌟 ฟังก์ชันส่งข้อมูล LINE ID ไปยืนยันตัวตนที่ Backend (ใช้กับ LIFF path)
  const linkLineToBackend = async (lineUserId: string, pictureUrl: string | null = null) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("ไม่พบการเข้าสู่ระบบ (Token หาย) กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
        return false;
      }

      const response = await fetch(`${apiUrl}/api/users/profile/link-line`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          line_user_id: lineUserId,
          picture_url: pictureUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("✅ เชื่อมต่อบัญชี LINE เรียบร้อยแล้ว");
        const updatedUser = { ...user, ...(data.user || data), line_user_id: lineUserId };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        if (data.user?.picture_url) {
          setForm((prev) => ({ ...prev, picture_url: data.user.picture_url }));
        }

        window.history.replaceState({}, "", window.location.pathname);
        return true;
      } else {
        setError(data.message || "เชื่อมต่อ LINE ไม่สำเร็จ");
        return false;
      }
    } catch (err) {
      console.error("[LINE Link] Exception:", err);
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
      setError("ยังไม่ได้ตั้งค่า VITE_LINE_LIFF_ID ในระบบ");
      return false;
    }

    liffInitPromiseRef.current = liff
      .init({ liffId })
      .then(() => true)
      .catch((err) => {
        console.error("LIFF Init Error:", err);
        setError("เกิดข้อผิดพลาดในการเริ่มต้นใช้งาน LINE");
        return false;
      })
      .finally(() => {
        liffInitPromiseRef.current = null;
      });

    return liffInitPromiseRef.current;
  };

  // Auto-Check LINE Binding On Return (LIFF only)
  useEffect(() => {
    if (!isValidLiffId(LIFF_ID?.trim())) return; // ข้ามถ้าไม่มี LIFF

    const initAndCheck = async () => {
      try {
        const initialized = await ensureLiffInitialized();
        if (!initialized) return;

        if (liff.isLoggedIn() && !user?.line_user_id) {
          setIsLinking(true);
          setSuccess("กำลังส่งข้อมูลยืนยันตัวตน LINE...");

          const profile = await liff.getProfile();
          if (profile?.userId) {
            await linkLineToBackend(profile.userId, profile.pictureUrl || null);
          }
        }
      } catch (err) {
        console.error("Auto-link LINE Error:", err);
      } finally {
        setIsLinking(false);
      }
    };

    if (user && !isLoadingProfile) {
      initAndCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingProfile]);

  // กดปุ่มเชื่อมต่อ LINE
  // ถ้ามี LIFF_ID → ใช้ LIFF (เดิม)
  // ถ้าไม่มี       → ใช้ LINE OAuth2 redirect ผ่าน Backend (แปลงจาก PHP LineLogin)
  const handleConnectLine = async () => {
    setError("");
    setSuccess("");
    setIsLinking(true);

    try {
      if (isValidLiffId(LIFF_ID?.trim())) {
        // ── LIFF path ─────────────────────────────────────────────────────
        const initialized = await ensureLiffInitialized();
        if (!initialized) return;

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: getLiffRedirectUri() });
          return;
        }

        const profile = await liff.getProfile();
        if (profile?.userId) {
          await linkLineToBackend(profile.userId, profile.pictureUrl || null);
        } else {
          throw new Error("ไม่พบ LINE User ID");
        }
      } else {
        // ── LINE OAuth2 path (แปลงจาก PHP LineLogin class) ──────────────
        // ส่ง JWT token ไปด้วยใน query เพื่อให้ Backend รู้ว่าเชื่อม LINE กับ user ไหน
        const token = localStorage.getItem("token");
        if (!token) {
          setError("ไม่พบ Token กรุณาเข้าสู่ระบบใหม่");
          return;
        }
        window.location.href = `${apiUrl}/api/auth/line?mode=link&token=${encodeURIComponent(token)}`;
        return; // browser จะ redirect ออก
      }
    } catch (err: any) {
      console.error("LINE Connect Error:", err);
      setError(err?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ LINE");
    } finally {
      setIsLinking(false);
    }
  };

  // บันทึกโปรไฟล์
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("อัปเดตข้อมูลโปรไฟล์สำเร็จ");
        const updatedUser = { ...user, ...(data.user || form) };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else if (response.status === 401 || response.status === 403) {
        setError("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
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

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-primary" /> โปรไฟล์ของฉัน
          </h1>
        </div>

        <Card className="shadow-sm border-border">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-primary/20 shadow-inner">
                  {form.picture_url ? (
                    <img src={form.picture_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all"
                  title="เปลี่ยนรูปโปรไฟล์"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div className="space-y-1">
                <CardTitle className="text-xl font-bold">{user?.username || "ผู้ใช้งาน"}</CardTitle>
                <p className="text-xs text-muted-foreground">สมาชิก Bus Joy</p>
                {user?.line_user_id ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 w-fit border border-emerald-500/20">
                    <MessageCircle className="w-3 h-3" /> เชื่อมต่อ LINE แล้ว
                  </span>
                ) : (
                  <span className="text-[10px] bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit">
                    ยังไม่ได้เชื่อมต่อ LINE
                  </span>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-xs font-semibold">ชื่อ-นามสกุล</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="นาย สมชาย ใจดี"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@email.com"
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="age" className="text-xs font-semibold">อายุ (ปี)</Label>
                  <Input
                    id="age"
                    type="number"
                    min={1}
                    max={120}
                    value={form.age || ""}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    placeholder="25"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gender" className="text-xs font-semibold">เพศ</Label>
                  <Select
                    value={form.gender}
                    onValueChange={(value) => setForm({ ...form, gender: value })}
                  >
                    <SelectTrigger className="rounded-xl">
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

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold">ที่อยู่</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง..."
                  className="rounded-xl"
                  required
                />
              </div>

              {error && <p className="text-xs text-destructive font-semibold">{error}</p>}
              {success && <p className="text-xs text-emerald-600 font-semibold">{success}</p>}

              {!user?.line_user_id && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#06C755] text-[#06C755] hover:bg-[#06C755]/10 font-bold rounded-xl py-5"
                    onClick={handleConnectLine}
                    disabled={isLinking}
                  >
                    {isLinking ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    )}
                    {isLinking ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อกับ LINE เพื่อรับแจ้งเตือน"}
                  </Button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                <Button type="submit" className="flex-1 font-bold rounded-xl py-5" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      บันทึกการเปลี่ยนแปลง
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 border-destructive/30 font-bold rounded-xl py-5"
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
