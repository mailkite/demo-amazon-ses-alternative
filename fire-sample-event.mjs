// Fires a signed sample `email.received` event at the local server — exactly the
// shape MailKite's delivery worker POSTs. Run `node server.mjs` first, then this.
import { createHmac } from "node:crypto";

const SECRET = process.env.MAILKITE_WEBHOOK_SECRET ?? "whsec_demo_secret";
const URL = process.env.HOOK_URL ?? "http://localhost:3000/hooks/mailkite";

const event = {
  id: "msg_2Hk9DEMO",
  type: "email.received",
  from: { address: "ada@example.com" },
  to: [{ address: "support@myapp.ai" }],
  subject: "Re: invoice #1042",
  text: "Looks good — approved!",
  html: "<p>Looks good — approved!</p>",
  threadId: "<a1b2c3@mail.example.com>",
  auth: { spf: "pass", dkim: "pass", dmarc: "pass", spam: "ham" },
  attachments: [
    {
      id: "msg_2Hk9DEMO:0",
      filename: "po.pdf",
      contentType: "application/pdf",
      size: 18213,
      url: "https://api.mailkite.dev/att/2Hk9DEMO/0?exp=demo&sig=demo",
    },
  ],
};

const rawBody = JSON.stringify(event);
const t = Math.floor(Date.now() / 1000);
const v1 = createHmac("sha256", SECRET).update(`${t}.${rawBody}`).digest("hex");

const res = await fetch(URL, {
  method: "POST",
  headers: { "content-type": "application/json", "x-mailkite-signature": `t=${t},v1=${v1}` },
  body: rawBody,
});
console.log(`POST ${URL} → ${res.status} ${await res.text()}`);
