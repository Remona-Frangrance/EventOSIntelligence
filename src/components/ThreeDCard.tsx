"use client";

import React, { useRef, useState } from "react";

interface ThreeDCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: "lime" | "cyan" | "violet" | "gold";
  maxTilt?: number;
}

export default function ThreeDCard({
  children,
  className = "",
  glowColor = "lime",
  maxTilt = 14,
}: ThreeDCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState("");
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const glowShadow = {
    lime: "rgba(200, 243, 29, 0.25)",
    cyan: "rgba(34, 211, 238, 0.25)",
    violet: "rgba(139, 92, 246, 0.25)",
    gold: "rgba(251, 191, 36, 0.25)",
  }[glowColor];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );

    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlare({ x: 50, y: 50, opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out, box-shadow 0.25s ease-out",
        boxShadow: glare.opacity > 0 ? `0 25px 60px -15px ${glowShadow}` : "none",
      }}
      className={`relative will-change-transform ${className}`}
    >
      {/* Dynamic 3D Glare Reflection Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: glare.opacity,
          background: `radial-gradient(circle 280px at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.18), transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}
