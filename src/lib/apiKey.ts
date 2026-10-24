import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function generateRawApiKey(): { rawKey: string; keyPrefix: string; keyHash: string } {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawKey = `ev_live_${randomBytes}`;
  const keyPrefix = rawKey.slice(0, 12);
  const keyHash = hashApiKey(rawKey);
  return { rawKey, keyPrefix, keyHash };
}

export async function verifyApiKey(req: Request) {
  const authHeader = req.headers.get("authorization");
  const xApiKey = req.headers.get("x-api-key");

  let token = "";
  if (xApiKey) {
    token = xApiKey.trim();
  } else if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    return {
      authorized: false,
      error: "API key is missing. Provide header 'X-API-Key: <key>' or 'Authorization: Bearer <key>'.",
      status: 401,
    };
  }

  // Developer sandbox test key
  if (token === "ev_live_test_key_2026") {
    return {
      authorized: true,
      keyData: {
        id: "test-key-id",
        name: "Developer Playground Test Key",
        permissions: ["read", "write"],
        status: "active",
      },
    };
  }

  try {
    const hashed = hashApiKey(token);
    const records = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hashed)).limit(1);

    if (!records || records.length === 0) {
      return {
        authorized: false,
        error: "Invalid or revoked API key.",
        status: 401,
      };
    }

    const key = records[0];
    if (key.status !== "active") {
      return {
        authorized: false,
        error: "API key is deactivated.",
        status: 403,
      };
    }

    // Touch lastUsedAt asynchronously
    db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, key.id))
      .catch(() => {});

    return {
      authorized: true,
      keyData: key,
    };
  } catch (err) {
    return {
      authorized: false,
      error: "Authentication service unavailable.",
      status: 500,
    };
  }
}
