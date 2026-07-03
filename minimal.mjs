// The entire MailKite receiving pipeline, minimal form. Node 18+, one dependency.
// npm install mailkite — the SDK verifies the signature (HMAC, replay window,
// constant-time compare) in one call. Hand-rolled equivalent: raw-server.mjs
import { createServer } from "node:http";
import { MailKite } from "mailkite";

const SECRET = process.env.MAILKITE_WEBHOOK_SECRET ?? "whsec_demo_secret";

createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;

  if (!MailKite.verifyWebhook(req.headers["x-mailkite-signature"], raw, SECRET)) {
    res.writeHead(401).end();
    return;
  }

  const event = JSON.parse(raw); // already parsed email — no S3, no MIME parser
  if (event.type === "email.received") {
    console.log(event.from.address, "·", event.subject, "·", event.text);
  }
  res.writeHead(200).end("ok");
}).listen(3000);
