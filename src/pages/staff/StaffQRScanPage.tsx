import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import { QrCode, CheckCircle, XCircle, User, Bus, MapPin, Calendar, Clock, ArrowLeft, LogOut, ScanLine, Ticket, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUser, logout } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ScanResult = null | "valid" | "invalid";

const StaffQRScanPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [cameraSupported, setCameraSupported] = useState(true);

  const stopCamera = () => {
    setIsScanning(false);
    if (scanFrameRef.current) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || scanResult) return;

    const context = canvas.getContext("2d");
    if (video.readyState === video.HAVE_ENOUGH_DATA && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code?.data) {
        setScanResult("valid");
        setIsScanning(false);
        return;
      }
    }

    scanFrameRef.current = window.requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    const user = getUser();
    if (!user || (user.role !== "staff" && user.role !== "admin")) {
      navigate("/login");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
      return;
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraError("");
        setIsScanning(true);
        scanFrameRef.current = window.requestAnimationFrame(scanFrame);
      } catch {
        stopCamera();
        setCameraError("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์หรืออุปกรณ์");
      }
    };

    startCamera();
    return () => stopCamera();
  }, [navigate]);

  const simulateScan = (result: ScanResult) => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(result);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">พนักงาน - ตรวจสอบตั๋ว</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout("/login")}>
            <LogOut className="w-4 h-4 mr-1" />ออกจากระบบ
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Scanner Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-primary" />สแกน QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-xl p-4 flex flex-col items-center justify-center text-center mb-4">
              {cameraError ? (
                <div className="space-y-3">
                  <QrCode className="w-24 h-24 text-destructive mx-auto" />
                  <p className="text-sm text-destructive">{cameraError}</p>
                  <p className="text-sm text-muted-foreground">กรุณาตรวจสอบสิทธิ์กล้องหรือเปลี่ยนอุปกรณ์</p>
                </div>
              ) : cameraSupported ? (
                <div className="w-full max-w-md rounded-3xl overflow-hidden bg-black relative">
                  <video
                    ref={videoRef}
                    className="h-80 w-full object-cover"
                    muted
                    playsInline
                    aria-label="Camera preview"
                  />
                  <div className="pointer-events-none absolute inset-0 border-4 border-primary/40 rounded-3xl" />
                </div>
              ) : (
                <div className="space-y-3">
                  <QrCode className="w-24 h-24 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">อุปกรณ์ไม่รองรับการใช้งานกล้อง</p>
                </div>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                {isScanning ? "กำลังสแกน QR Code..." : "นำ QR Code มาไว้ในกรอบเพื่อสแกน"}
              </p>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => simulateScan("valid")}>
                จำลองสแกน (ถูกต้อง)
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => simulateScan("invalid")}>
                จำลองสแกน (ไม่ถูกต้อง)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Validation Result */}
        {scanResult && (
          <Card className={scanResult === "valid" ? "border-success" : "border-destructive"}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {scanResult === "valid" ? (
                  <>
                    <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-success text-lg">ตั๋วถูกต้อง</p>
                      <p className="text-sm text-muted-foreground">ตรวจสอบแล้ว สามารถขึ้นรถได้</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                      <XCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <div>
                      <p className="font-bold text-destructive text-lg">ตั๋วไม่ถูกต้อง</p>
                      <p className="text-sm text-muted-foreground">ไม่พบข้อมูลตั๋วในระบบ</p>
                    </div>
                  </>
                )}
              </div>

              {scanResult === "valid" && (
                <div className="space-y-2 text-sm border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Ticket className="w-3 h-3" />รหัสตั๋ว</span>
                    <span className="font-medium text-foreground">BK-2569031501</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />ผู้โดยสาร</span>
                    <span className="font-medium text-foreground">สมชาย ใจดี</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />เส้นทาง</span>
                    <span className="font-medium text-foreground">กรุงเทพ → เชียงใหม่</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />วันที่</span>
                    <span className="font-medium text-foreground">15 มี.ค. 2569</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ที่นั่ง</span>
                    <span className="font-medium text-foreground">A1, A2</span>
                  </div>
                  <Button className="w-full mt-4 bg-success hover:bg-success/90 text-success-foreground">
                    <CheckCircle className="w-4 h-4 mr-1" />ยืนยันขึ้นรถ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate("/staff/seats")} className="w-full max-w-xs">
            จัดการที่นั่งรถ
          </Button>
        </div>
      </main>
    </div>
  );
};

export default StaffQRScanPage;
