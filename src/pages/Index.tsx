import { Link } from "react-router-dom";
import { Ticket, Search, LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  // ดึงข้อมูล User จาก LocalStorage มาเช็กว่า Login อยู่หรือไม่
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card shadow-lg p-8 md:p-12 text-center">
        {/* Logo / Header */}
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-8 h-8" />
        </div>
        
        <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-foreground">
          Bus Joy
        </h1>
        <p className="mb-8 text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
          ยินดีต้อนรับสู่ระบบจองตั๋วรถทัวร์ออนไลน์ สะดวกรวดเร็ว ค้นหาเที่ยวรถ เลือกที่นั่ง และจัดการตั๋วได้ง่ายๆ ในที่เดียว
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          {/* ปุ่มหลัก: ค้นหาเที่ยวรถ */}
          <Link to="/search">
            <Button size="lg" className="w-full sm:w-auto rounded-full gap-2">
              <Search className="w-4 h-4" />
              ค้นหาเที่ยวรถ
            </Button>
          </Link>

          {/* แสดงปุ่มตามสถานะ Login */}
          {user ? (
            <Link to="/passenger/tickets">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-full gap-2">
                <Ticket className="w-4 h-4" />
                ตั๋วของฉัน
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full gap-2">
                  <LogIn className="w-4 h-4" />
                  เข้าสู่ระบบ
                </Button>
              </Link>

              <Link to="/register">
                <Button size="lg" variant="ghost" className="w-full sm:w-auto rounded-full gap-2 border border-border">
                  <UserPlus className="w-4 h-4" />
                  สมัครสมาชิก
                </Button>
              </Link>
            </>
          )}

          {/* ทางเข้าพนักงาน */}
          <Link to="/login?role=staff">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-full gap-2 bg-secondary/50 hover:bg-secondary">
              <ShieldCheck className="w-4 h-4" />
              พนักงานตรวจตั๋ว
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;