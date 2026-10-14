import { Resend } from "resend";

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 3;
const hits = new Map();

const rateLimited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
};

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
    console.error("variaveis de ambiente do resend nao configuradas");
    return res.status(500).json({ error: "server_not_configured" });
  }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "rate_limited" });

  let payload = req.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: "invalid_body" });
    }
  }
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "invalid_body" });
  }

  if (payload.website) return res.status(200).json({ ok: true });

  const name = String(payload.name || "").trim().slice(0, 100);
  const email = String(payload.email || "").trim().slice(0, 200);
  const message = String(payload.message || "").trim().slice(0, 5000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "invalid_fields" });
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `Contato pelo portfólio - ${name}`,
      text: `${message}\n\n${name} <${email}>`,
      html: `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><hr><p>${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>`,
    });
    if (error) {
      console.error("resend:", error);
      return res.status(502).json({ error: "send_failed" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("resend:", err);
    return res.status(502).json({ error: "send_failed" });
  }
}
