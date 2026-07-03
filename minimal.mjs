// The entire MailKite receiving pipeline, minimal form. Node 18+, zero dependencies.
// Full version with replay window + tests: server.mjs
import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.MAILKITE_WEBHOOK_SECRET ?? "whsec_demo_secret";

createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;

  // x-mailkite-signature: t=<unix>,v1=<hmac-sha256 hex over "<t>.<rawBody>">
  const [, t, theirs] = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(req.headers["x-mailkite-signature"] ?? "") ?? [];
  const ours = t && createHmac("sha256", SECRET).update(`${t}.${raw}`).digest("hex");
  if (!ours || !timingSafeEqual(Buffer.from(ours), Buffer.from(theirs))) {
    res.writeHead(401).end();
    return;
  }

  const event = JSON.parse(raw); // already parsed email — no S3, no MIME parser
  if (event.type === "email.received") {
    console.log(event.from.address, "·", event.subject, "·", event.text);
  }
  res.writeHead(200).end("ok");
}).listen(3000);
