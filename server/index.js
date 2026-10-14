import { createServer } from "node:http";
import { Resend } from "resend";

const PORT = Number(process.env.API_PORT || 3001);
const { RESEND_API_KEY, CONTACT_TO, CONTACT_FROM } = process.env;

if (!RESEND_API_KEY || !CONTACT_TO || !CONTACT_FROM) {
  console.error("Defina RESEND_API_KEY, CONTACT_TO e CONTACT_FROM no .env");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

const MAX_BODY = 10_000;
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

const send = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY) {
        reject(new Error("too_large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/api/contact") {
    return send(res, 404, { error: "not_found" });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
  if (rateLimited(ip)) return send(res, 429, { error: "rate_limited" });

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    return send(res, 400, { error: "invalid_body" });
  }

  const name = String(payload.name || "").trim().slice(0, 100);
  const email = String(payload.email || "").trim().slice(0, 200);
  const message = String(payload.message || "").trim().slice(0, 5000);

  if (payload.website) return send(res, 200, { ok: true });

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return send(res, 400, { error: "invalid_fields" });
  }

  try {
    const { error } = await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: email,
      subject: `Contato pelo portfólio - ${name}`,
      text: `${message}\n\n${name} <${email}>`,
      html: `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p><hr><p>${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>`,
    });
    if (error) {
      console.error("Resend:", error);
      return send(res, 502, { error: "send_failed" });
    }
    return send(res, 200, { ok: true });
  } catch (err) {
    console.error("Resend:", err);
    return send(res, 502, { error: "send_failed" });
  }
}).listen(PORT, "127.0.0.1", () => console.log(`API de contato em http://127.0.0.1:${PORT}`));
