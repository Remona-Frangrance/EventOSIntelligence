"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  withLink?: boolean;
}

export default function Logo({ className = "", size = "md", withLink = false }: LogoProps) {
  const heightClass = {
    sm: "h-8 sm:h-9",
    md: "h-11 sm:h-12",
    lg: "h-14 sm:h-16",
    xl: "h-18 sm:h-24",
  }[size];

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official Event Intelligence OS Brand Logo */}
      <img
        src="/logo.png"
        alt="Event Intelligence OS — Plan · Engage · Analyze · Grow"
        className={`${heightClass} w-auto object-contain shrink-0 drop-shadow-xs transition duration-200 hover:scale-[1.02]`}
      />
    </div>
  );

  if (withLink) {
    return (
      <Link href="/" className="inline-flex items-center transition hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
