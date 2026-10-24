import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import PwaRegister from "@/components/PwaRegister";
import AiChatbot from "@/components/AiChatbot";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Event Intelligence OS — Every event. One intelligent system.",
  description:
    "From registration and QR check-in to live judging, visitor insights, and certificates — manage your entire event in one place.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#FAFAF9] text-slate-900 antialiased selection:bg-indigo-600 selection:text-white min-h-screen flex flex-col font-sans">
        <AuthProvider>
          <LanguageProvider>
            <PwaRegister />
            <Navbar />
            <div className="flex-1">{children}</div>
            <AiChatbot />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
