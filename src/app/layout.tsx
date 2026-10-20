import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ThreeDBackground from "@/components/ThreeDBackground";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Intelligence OS — Multi-Role Hackathon & Expo Platform",
  description:
    "Next-gen event infrastructure for hackathons, tech expos and conferences. Live scoring, AI judge matching, scannable QR passes, and tamper-proof certificates.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#05070f] text-white antialiased selection:bg-[#c8f31d] selection:text-black">
        {/* Interactive 3D Background Canvas */}
        <ThreeDBackground />
        <AuthProvider>
          <Navbar />
          <div className="relative z-10">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}

