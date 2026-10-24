import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isVideo = file.type.startsWith("video/") || Boolean(file.name.match(/\.(mp4|webm|mov|ogg|mkv)$/i));

    // 1. If Cloudinary credentials are provided, upload to public Cloudinary CDN
    if (isCloudinaryConfigured) {
      try {
        const cloudResult = await uploadToCloudinary(buffer, {
          folder: "eventos_media",
          resource_type: isVideo ? "video" : "image",
          filename: file.name,
        });

        return NextResponse.json({
          success: true,
          url: cloudResult.url,
          publicId: cloudResult.publicId,
          provider: "cloudinary",
          fileName: file.name,
          size: file.size,
        });
      } catch (cloudErr: any) {
        console.warn("[Cloudinary Upload Failed, falling back to local storage]:", cloudErr.message || cloudErr);
      }
    }

    // 2. Fallback to server public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      provider: "local",
      fileName: file.name,
      size: file.size,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}
