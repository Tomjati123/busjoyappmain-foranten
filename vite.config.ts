import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
      // 🟢 แก้จาก 5000 เป็น 8080 (ให้ตรงกับพอร์ตของ Vite server)
      port: 8080,
      clientPort: 8080,
    },
    allowedHosts: [
      "bootleg-duration-helpful.ngrok-free.dev",
      ".ngrok-free.dev", // อนุญาตทุก subdomain ของ Ngrok
      "localhost",
    ],
    // 🟢 Proxy: ส่ง /api/* ผ่าน ngrok URL ไปยัง backend localhost:5000
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      },
    },
    // 🟢 ส่ง header นี้ใน response ทุก request เพื่อข้าม ngrok interstitial
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));