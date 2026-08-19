import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Bus, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card shadow-lg p-8 md:p-10 text-center">
        {/* Animated/Styled Bus Icon Badge */}
        <div className="relative w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Bus className="w-12 h-12" />
          <span className="absolute -bottom-2 -right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-0.5 rounded-full border-2 border-card">
            404
          </span>
        </div>

        {/* Text Details */}
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
          ไม่พบหน้าที่คุณต้องการ
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          เส้นทาง <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-xs">{location.pathname}</code> อาจถูกลบ เปลี่ยนชื่อ หรือไม่เปิดให้บริการในขณะนี้
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            className="w-full sm:w-auto rounded-full gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
            ย้อนกลับ
          </Button>

          <Link to="/" className="w-full sm:w-auto">
            <Button className="w-full rounded-full gap-2">
              <Home className="w-4 h-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;