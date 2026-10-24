import crypto from "crypto";

const CERTIFICATE_SECRET =
  process.env.CERTIFICATE_SECRET || "eventos-cert-secret-2026-tamper-proof-hmac-key";

/**
 * Generate a deterministic, tamper-proof HMAC-SHA256 signature for a certificate.
 */
export function generateCertificateHMAC(
  code: string,
  recipientName: string,
  eventId: string,
  role: string = "participant"
): string {
  const payload = `${code.trim().toUpperCase()}:${recipientName.trim().toLowerCase()}:${eventId.trim()}:${role.trim().toLowerCase()}`;
  return crypto.createHmac("sha256", CERTIFICATE_SECRET).update(payload).digest("hex");
}

export function generateVerificationHash(params: {
  code: string;
  recipientName: string;
  eventId: string;
  role?: string;
}): string {
  return generateCertificateHMAC(params.code, params.recipientName, params.eventId, params.role || "participant");
}

/**
 * Verify a certificate's HMAC signature.
 */
export function verifyCertificateHMAC(
  code: string,
  recipientName: string,
  eventId: string,
  role: string,
  hash: string
): boolean {
  if (!hash) return false;
  const expected = generateCertificateHMAC(code, recipientName, eventId, role);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  } catch {
    return expected === hash;
  }
}

export function verifyCredentialHash(
  params: { code: string; recipientName: string; eventId: string; role?: string },
  hash: string
): boolean {
  return verifyCertificateHMAC(params.code, params.recipientName, params.eventId, params.role || "participant", hash);
}

/**
 * Secure password hashing with salt using PBKDF2 / SHA-256.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !storedHash.includes(":")) {
    return password === storedHash;
  }
  const [salt, originalHash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha256").toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(testHash));
  } catch {
    return originalHash === testHash;
  }
}
