# demo-amazon-ses-alternative

The runnable half of [The Amazon SES alternative for developers](https://mailkite.dev/blog/amazon-ses-alternative/):
receive an inbound email as parsed JSON with a **zero-dependency Node webhook** —
signature verification and all — next to the SES pipeline it replaces
(`ses-contrast/handler.mjs`).

[![ci](https://github.com/mailkite/demo-amazon-ses-alternative/actions/workflows/ci.yml/badge.svg)](https://github.com/mailkite/demo-amazon-ses-alternative/actions/workflows/ci.yml)

## Run it in one click

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/mailkite/demo-amazon-ses-alternative?file=server.mjs)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mailkite/demo-amazon-ses-alternative)
[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy?repo=https://github.com/mailkite/demo-amazon-ses-alternative)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mailkite/demo-amazon-ses-alternative)

StackBlitz runs the whole thing in your browser tab (WebContainers — real Node, no
account needed): open it, then in the terminal run `npm start`, and in a second
terminal `npm run fire-sample-event`.

## Run it locally

```sh
git clone https://github.com/mailkite/demo-amazon-ses-alternative
cd demo-amazon-ses-alternative
node server.mjs                 # terminal 1 → listening on :3000
node fire-sample-event.mjs      # terminal 2 → fires a signed email.received event
```

Expected output in terminal 1:

```
from:    ada@example.com
subject: Re: invoice #1042
auth:    spf=pass dkim=pass dmarc=pass
text:    Looks good — approved!
attach:  po.pdf (application/pdf, 18213 bytes) → https://api.mailkite.dev/att/…
```

Tamper with the body or the secret and the server answers `401` — try it:
`npm test` runs the five signature cases (valid, wrong secret, tampered body,
replayed timestamp, malformed header).

## How it works

- `server.mjs` — the entire receiving pipeline: verify `x-mailkite-signature`
  (HMAC-SHA256 over `"<t>.<rawBody>"`, 5-minute replay window, constant-time compare),
  then read `event.text` / `event.html` / `event.attachments` directly. ~60 lines,
  no dependencies.
- `fire-sample-event.mjs` — signs and POSTs the same payload shape MailKite's delivery
  worker sends, so the demo works with no account.
- `server.test.mjs` — signature verification test vectors (`node --test`).
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
