# demo-amazon-ses-alternative

The runnable half of [The Amazon SES alternative for developers](https://mailkite.dev/blog/amazon-ses-alternative/):
receive an inbound email as parsed JSON in ~25 lines using the [`mailkite`](https://www.npmjs.com/package/mailkite)
SDK — `MailKite.verifyWebhook()` handles the signature, replay window, and constant-time
compare in one call — next to the SES pipeline it replaces (`ses-contrast/handler.mjs`).
A zero-dependency raw variant (`raw-server.mjs`) shows what the SDK is doing for you.

[![ci](https://github.com/mailkite/demo-amazon-ses-alternative/actions/workflows/ci.yml/badge.svg)](https://github.com/mailkite/demo-amazon-ses-alternative/actions/workflows/ci.yml)

## Run it in one click

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/mailkite/demo-amazon-ses-alternative?file=server.mjs)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mailkite/demo-amazon-ses-alternative?quickstart=1)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mailkite/demo-amazon-ses-alternative)

StackBlitz runs the whole thing in your browser tab (WebContainers — real Node, no
account needed): open it and it boots the server, self-fires a correctly signed sample
event, and prints the round trip — zero setup, no domain.

## Run it locally — one command

```sh
git clone https://github.com/mailkite/demo-amazon-ses-alternative
cd demo-amazon-ses-alternative
npm install     # one dependency: mailkite
npm start       # boots the server, self-fires a signed email.received event, stays up
```

`npm start` prints the whole round trip — the receiver verifies the signature and reads
the decoded message straight off the JSON (no S3 fetch, no MIME parse), and the server
stays up for more:

```
listening on http://localhost:3000/hooks/mailkite

from:    ada@example.com
subject: Re: invoice #1042
auth:    spf=pass dkim=pass dmarc=pass
text:    Looks good — approved!
attach:  po.pdf (application/pdf, 18213 bytes) → https://api.mailkite.dev/att/…

— self-fired one signed email.received event → 200 ok
  server's still up: POST your own events to :3000/hooks/mailkite, or point real email here.
```

A webhook needs a public URL in production; `npm start` sidesteps that by POSTing to its
own localhost, so the full loop runs anywhere. Want the halves separately? `npm run serve`
runs just the server, and `npm run fire-sample-event` fires the event from another
terminal. Tamper with the body or the secret and the server answers `401` — try it:
`npm test` runs the five signature cases (valid, wrong secret, tampered body,
replayed timestamp, malformed header).

## How it works

- `server.mjs` — the entire receiving pipeline with the SDK:
  `MailKite.verifyWebhook(sig, rawBody, secret)` then read `event.text` /
  `event.html` / `event.attachments` directly.
- `minimal.mjs` — the ~25-line version embedded in the blog post.
- `raw-server.mjs` — **labeled raw alternative** (zero dependencies): hand-rolled
  HMAC-SHA256 over `"<t>.<rawBody>"` with a 5-minute replay window and constant-time
  compare — everything the SDK call absorbs. (Fun fact: the first draft of this file
  got the timestamp unit wrong — `t` is *milliseconds* — which is precisely why you
  want the SDK doing this.)
- `fire-sample-event.mjs` — signs and POSTs the same payload shape MailKite's delivery
  worker sends, so the demo works with no account.
- `server.test.mjs` — signature vectors for the raw implementation + an SDK/raw parity
  test (`node --test`).
- `ses-contrast/handler.mjs` — the Amazon SES version of "receive one email": the
  Lambda you'd write *after* setting up receipt rules, S3, SNS, and IAM — which still
  has to fetch raw MIME from S3 and parse it itself.

To point real email at it: [verify a domain on MailKite](https://mailkite.dev/docs/quickstart),
set your webhook URL to this server, and set `MAILKITE_WEBHOOK_SECRET` to your account's
signing secret ([webhook security docs](https://mailkite.dev/docs/webhook-security)).

## License

MIT — built by the MailKite team. This demo accompanies
[The Amazon SES alternative for developers](https://mailkite.dev/blog/amazon-ses-alternative/).
Questions or issues → [open an issue](https://github.com/mailkite/demo-amazon-ses-alternative/issues).
