// One-command demo: boot the webhook receiver, self-fire the signed sample event at it,
// print the round trip, and stay up. This is `npm start` — first parsed inbound email in
// one command, no domain, no account, none of the SES receipt-rule + S3 + SNS pipeline.
// A webhook needs a public URL in production; here the demo POSTs to its own localhost,
// so the whole loop runs anywhere (your machine, StackBlitz, Codespaces). Point real
// email at server.mjs when you're ready.
import { server } from "./server.mjs";
import { fireSampleEvent } from "./sample-event.mjs";

const PORT = Number(process.env.PORT ?? 3000);
const SECRET = process.env.MAILKITE_WEBHOOK_SECRET ?? "whsec_demo_secret";

server.listen(PORT, async () => {
  console.log(`listening on http://localhost:${PORT}/hooks/mailkite\n`);

  const { status, text } = await fireSampleEvent({
    url: `http://localhost:${PORT}/hooks/mailkite`,
    secret: SECRET,
  });

  // The receiver acks 200 and logs the decoded message (from/subject/auth/text/attach)
  // just above this line. Small pause so the round trip reads top-to-bottom.
  await new Promise((r) => setTimeout(r, 300));
  console.log(`\n— self-fired one signed email.received event → ${status} ${text}`);
  console.log(`  server's still up: POST your own events to :${PORT}/hooks/mailkite, or point real email here.`);
});
