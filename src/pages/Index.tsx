import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-card shadow-lg p-10 text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">Bus Joy</h1>
        <p className="mb-8 text-lg text-muted-foreground">
          ยินดีต้อนรับสู่ระบบจองตั๋วรถทัวร์ออนไลน์ คุณสามารถเข้าสู่ระบบหรือสมัครสมาชิกเพื่อเริ่มใช้งานได้ทันที
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/passenger/tickets" className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
            <Ticket className="mr-2 h-4 w-4" />
            ตั๋วของฉัน
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
            เข้าสู่ระบบ
          </Link>
          <Link to="/login?role=staff" className="inline-flex items-center justify-center rounded-full bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground shadow-sm hover:bg-secondary/90">
            พนักงานตรวจตั๋ว
          </Link>
          <Link to="/register" className="inline-flex items-center justify-center rounded-full border border-border bg-transparent px-6 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground">
            สมัครสมาชิก
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
