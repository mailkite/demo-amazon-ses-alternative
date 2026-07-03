import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { MailKite } from "mailkite";
import { verifySignature } from "./raw-server.mjs";

const SECRET = "whsec_test";
const body = JSON.stringify({ type: "email.received" });
const t = 1_750_000_000_000; // ms since epoch — the unit MailKite signs with
const sign = (secret, ts, raw) =>
  `t=${ts},v1=${createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex")}`;

test("accepts a valid signature within tolerance", () => {
  assert.equal(verifySignature(sign(SECRET, t, body), body, SECRET, t + 10_000), true);
});

test("rejects a wrong secret", () => {
  assert.equal(verifySignature(sign("whsec_other", t, body), body, SECRET, t + 10_000), false);
});

test("rejects a tampered body", () => {
  assert.equal(verifySignature(sign(SECRET, t, body), body + " ", SECRET, t + 10_000), false);
});

test("rejects a stale timestamp (replay)", () => {
  assert.equal(verifySignature(sign(SECRET, t, body), body, SECRET, t + 3_600_000), false);
});

test("rejects malformed headers", () => {
  assert.equal(verifySignature("v1=deadbeef", body, SECRET, t), false);
  assert.equal(verifySignature(undefined, body, SECRET, t), false);
});

test("SDK and raw implementations agree on a fresh valid signature", () => {
  const nowMs = Date.now();
  const header = sign(SECRET, nowMs, body);
  assert.equal(MailKite.verifyWebhook(header, body, SECRET), true);
  assert.equal(verifySignature(header, body, SECRET, nowMs), true);
  assert.equal(MailKite.verifyWebhook(header, body + "x", SECRET), false);
});
