// The canonical sample `email.received` event MailKite's delivery worker POSTs,
// plus the signer — shared by fire-sample-event.mjs (CLI) and demo.mjs (one command).
// Decoded text/html, a normalized `auth` block, and attachments as signed URLs —
// no S3, no MIME parser, none of the SES receipt pipeline.
import { createHmac } from "node:crypto";

export const sampleEvent = {
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

// Sign the exact way MailKite does — t is MILLISECONDS since the epoch — and POST it.
export async function fireSampleEvent({ url, secret, event = sampleEvent }) {
  const rawBody = JSON.stringify(event);
  const t = Date.now();
  const v1 = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-mailkite-signature": `t=${t},v1=${v1}` },
    body: rawBody,
  });
  return { status: res.status, text: await res.text() };
}
