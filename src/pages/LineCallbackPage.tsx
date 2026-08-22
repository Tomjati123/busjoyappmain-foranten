import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { getDefaultPathForUser } from "@/hooks/useAuth";

/**
 * LineCallbackPage
 * Backend redirect กลับมาที่นี่หลัง LINE OAuth2 สำเร็จ
 * URL: /line-callback?token=JWT&user=JSON
 */
const LineCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("กำลังตรวจสอบบัญชี LINE...");

  useEffect(() => {
    const token = searchParams.get("token");
    const userRaw = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      const msgs: Record<string, string> = {
        line_cancelled:    "คุณยกเลิกการเข้าสู่ระบบ LINE",
        line_token_failed: "ไม่สามารถรับ Token จาก LINE ได้",
        line_no_userid:    "ไม่พบ LINE User ID",
        line_server_error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์",
      };
      setMessage(msgs[error] || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ LINE");
      setStatus("error");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (!token || !userRaw) {
      setMessage("ไม่พบข้อมูลการเข้าสู่ระบบ");
      setStatus("error");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      login({ token, user });

      setMessage("ยินดีต้อนรับ, " + (user.name || "ผู้ใช้งาน") + " 🎉");
      setStatus("success");

      setTimeout(() => {
        navigate(getDefaultPathForUser(user), { replace: true });
      }, 1500);
    } catch (err) {
      console.error("[LineCallback] Parse error:", err);
      setMessage("ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง");
      setStatus("error");
      setTimeout(() => navigate("/login"), 3000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
      {status === "loading" && (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-[#06C755]" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle className="w-12 h-12 text-[#06C755]" />
          <p className="text-foreground font-semibold">{message}</p>
          <p className="text-muted-foreground text-xs">กำลังพาไปยังหน้าหลัก...</p>
        </>
      )}
      {status === "error" && (
        <>
          <XCircle className="w-12 h-12 text-destructive" />
          <p className="text-destructive font-semibold">{message}</p>
          <p className="text-muted-foreground text-xs">กำลังพากลับไปหน้าเข้าสู่ระบบ...</p>
        </>
      )}
    </div>
  );
};

export default LineCallbackPage;