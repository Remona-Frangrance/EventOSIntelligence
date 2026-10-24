import nodemailer from "nodemailer";

export interface LoginEmailPayload {
  to: string;
  name: string;
  role: string;
  time?: string;
  ip?: string;
  userAgent?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  simulated?: boolean;
  error?: string;
}

function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  return null;
}

export async function sendLoginSuccessEmail(payload: LoginEmailPayload): Promise<EmailResult> {
  const { to, name, role, time = new Date().toLocaleString("en-US", { timeZoneName: "short" }) } = payload;
  const from = process.env.SMTP_FROM || '"EventOS Intelligence" <notifications@eventos.ai>';
  const subject = `Successful Sign-In: EventOS Intelligence (${role.toUpperCase()})`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f1d; color: #ffffff; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background: #13192e; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #7c3aed, #06b6d4); padding: 32px 24px; text-align: center; }
          .title { font-size: 24px; font-weight: 800; margin: 0; color: #ffffff; letter-spacing: -0.5px; }
          .subtitle { font-size: 13px; color: rgba(255, 255, 255, 0.85); margin-top: 6px; font-family: monospace; text-transform: uppercase; letter-spacing: 1px; }
          .body { padding: 32px 28px; }
          .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
          .desc { font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.7); margin-bottom: 24px; }
          .details-card { background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.06); font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .label { color: rgba(255, 255, 255, 0.5); }
          .val { font-weight: 600; color: #c8f31d; font-family: monospace; }
          .notice { font-size: 12px; line-height: 1.5; color: rgba(255, 255, 255, 0.45); border-left: 3px solid #f59e0b; padding-left: 12px; margin-top: 20px; }
          .footer { padding: 20px; text-align: center; font-size: 11px; color: rgba(255, 255, 255, 0.35); border-top: 1px solid rgba(255, 255, 255, 0.06); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">EVENT INTELLIGENCE OS</h1>
            <div class="subtitle">Platform Security &amp; Audit Protocol</div>
          </div>
          <div class="body">
            <div class="greeting">Hello, ${name || "User"}! 👋</div>
            <p class="desc">
              This is an automated security confirmation confirming that you have successfully signed into your <strong>EventOS Intelligence</strong> account.
            </p>
            <div class="details-card">
              <div class="row">
                <span class="label">Account Email:</span>
                <span class="val" style="color: #ffffff;">${to}</span>
              </div>
              <div class="row">
                <span class="label">Access Role:</span>
                <span class="val">${role.toUpperCase()}</span>
              </div>
              <div class="row">
                <span class="label">Timestamp:</span>
                <span class="val" style="color: #38bdf8;">${time}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span class="val" style="color: #34d399;">✓ Authenticated</span>
              </div>
            </div>
            <div class="notice">
              <strong>Security Note:</strong> If you initiated this sign-in, no further action is required. If you did not log into EventOS Intelligence, please secure your credentials immediately.
            </div>
          </div>
          <div class="footer">
            Event Intelligence OS · 4-Role Multi-Tenant Operating System<br/>
            Automated Notification Service
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `Event Intelligence OS: Successful Login\n\nHello ${name || "User"},\n\nYou have successfully logged into EventOS Intelligence as ${role.toUpperCase()} on ${time}.\n\nIf this was you, you can safely disregard this email.\n\nEventOS Intelligence Platform`;

  try {
    const transporter = getMailTransporter();

    if (transporter) {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      console.log(`[Email] Login success email sent to ${to} (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId, simulated: false };
    }

    // Fallback: SMTP not configured in env, log to server console
    console.log(`[Email Notification Simulated] Login success email dispatched to: ${to} (User: ${name}, Role: ${role}, Time: ${time})`);
    return {
      success: true,
      simulated: true,
      messageId: "sim-" + Math.random().toString(36).substring(2, 10),
    };
  } catch (err) {
    console.error("[Email Error] Failed to send login email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
