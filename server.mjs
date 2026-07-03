// MailKite inbound webhook receiver — the SDK does the fiddly part.
// `MailKite.verifyWebhook` checks the HMAC-SHA256 signature, replay window, and does a
// constant-time compare in one call. The no-dependency version of this file (hand-rolled
// verification, for contrast) is ./raw-server.mjs.
import { createServer } from "node:http";
import { MailKite } from "mailkite";

const PORT = Number(process.env.PORT ?? 3000);
const SECRET = process.env.MAILKITE_WEBHOOK_SECRET ?? "whsec_demo_secret";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/hooks/mailkite") {
    res.writeHead(404).end();
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (!MailKite.verifyWebhook(req.headers["x-mailkite-signature"], rawBody, SECRET)) {
    res.writeHead(401).end("invalid signature");
    return;
  }

  const event = JSON.parse(rawBody); // already parsed email — no S3, no MIME parser
  if (event.type === "email.received") {
    console.log(`from:    ${event.from.address}`);
    console.log(`subject: ${event.subject}`);
    console.log(`auth:    spf=${event.auth.spf} dkim=${event.auth.dkim} dmarc=${event.auth.dmarc}`);
    console.log(`text:    ${event.text}`);
    for (const a of event.attachments ?? []) {
      console.log(`attach:  ${a.filename} (${a.contentType}, ${a.size} bytes) → ${a.url}`);
    }
  }
  res.writeHead(200).end("ok"); // ack fast; do heavy work out of band
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => console.log(`listening on http://localhost:${PORT}/hooks/mailkite`));
}
