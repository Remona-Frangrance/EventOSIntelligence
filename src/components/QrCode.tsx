"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QrCode({
  value,
  size = 180,
  dark = "#05070f",
  light = "#ffffff",
  className = "",
}: {
  value: string;
  size?: number;
  dark?: string;
  light?: string;
  className?: string;
}) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 2,
      color: { dark, light },
      errorCorrectionLevel: "M",
    })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [value, size, dark, light]);
  if (!src)
    return (
      <div
        className={`animate-pulse rounded-xl bg-white/10 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  return <img src={src} alt="QR code" width={size} height={size} className={`rounded-xl ${className}`} />;
}
