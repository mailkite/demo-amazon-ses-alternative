import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifySignature } from "./server.mjs";

const SECRET = "whsec_test";
const body = JSON.stringify({ type: "email.received" });
const t = 1_750_000_000;
const sign = (secret, ts, raw) =>
  `t=${ts},v1=${createHmac("sha256", secret).update(`${ts}.${raw}`).digest("hex")}`;

test("accepts a valid signature within tolerance", () => {
  assert.equal(verifySignature(sign(SECRET, t, body), body, SECRET, t + 10), true);
});

test("rejects a wrong secret", () => {
  assert.equal(verifySignature(sign("whsec_other", t, body), body, SECRET, t + 10), false);
});

test("rejects a tampered body", () => {
  assert.equal(verifySignature(sign(SECRET, t, body), body + " ", SECRET, t + 10), false);
});

test("rejects a stale timestamp (replay)", () => {
  assert.equal(verifySignature(sign(SECRET, t, body), body, SECRET, t + 3600), false);
});

test("rejects malformed headers", () => {
  assert.equal(verifySignature("v1=deadbeef", body, SECRET, t), false);
  assert.equal(verifySignature(undefined, body, SECRET, t), false);
});
