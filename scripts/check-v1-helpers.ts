import assert from "node:assert/strict";
import { periodRange, parsePeriod } from "../src/lib/period";
import { icsCalendar, icsEscape } from "../src/lib/ics";
import { scaleHints } from "../src/lib/scale";
import { demoLoginEnabled, googleOAuthEnabled } from "../src/lib/auth-mode";

const june = new Date("2026-06-15T12:00:00");
const sem = periodRange("semestre", june);
assert.equal(sem.start.getMonth(), 0);
assert.equal(sem.end.getMonth(), 5);

const july = new Date("2026-07-02T12:00:00");
const second = periodRange("semestre", july);
assert.equal(second.start.getMonth(), 6);
assert.equal(second.end.getMonth(), 11);
assert.equal(parsePeriod("ano"), "ano");
assert.equal(parsePeriod("nope"), "mes");

const ics = icsCalendar([
  {
    uid: "evt-1@darpe.local",
    title: "Ensaio, regional",
    start: new Date("2026-09-20T19:00:00"),
    end: new Date("2026-09-20T21:00:00"),
    location: "CCB Central",
  },
]);
assert.match(ics, /BEGIN:VCALENDAR/);
assert.match(ics, /SUMMARY:Ensaio\\, regional/);
assert.equal(icsEscape("a;b"), "a\\;b");

const occurrence = new Date("2026-09-19T09:00:00");
const hints = scaleHints(
  [
    {
      personId: "ana",
      name: "Ana Clara",
      status: "ACTIVE",
      competencies: ["CANTOR"],
      availability: [{ weekday: 6, available: false }],
      blocks: [],
      link: { startAt: new Date("2026-01-01"), endAt: null },
    },
    {
      personId: "pedro",
      name: "Pedro Henrique",
      status: "ACTIVE",
      competencies: ["ATENDENTE"],
      availability: [{ weekday: 6, available: true }],
      blocks: [],
      link: { startAt: new Date("2026-01-01"), endAt: null },
    },
  ],
  occurrence,
  new Set(),
  new Map([["pedro", "Presídio"]]),
);
assert.equal(hints[0].personId, "ana");
assert.equal(hints[0].eligible, false);
assert.match(hints[0].reason ?? "", /Indisponível/);
assert.equal(hints[1].personId, "pedro");
assert.match(hints[1].reason ?? "", /Conflito/);

const prevId = process.env.AUTH_GOOGLE_ID;
const prevSecret = process.env.AUTH_GOOGLE_SECRET;
const prevDemo = process.env.AUTH_ALLOW_DEMO;
delete process.env.AUTH_GOOGLE_ID;
delete process.env.AUTH_GOOGLE_SECRET;
assert.equal(googleOAuthEnabled(), false);
process.env.AUTH_GOOGLE_ID = "client-id";
process.env.AUTH_GOOGLE_SECRET = "client-secret";
assert.equal(googleOAuthEnabled(), true);
process.env.AUTH_ALLOW_DEMO = "false";
assert.equal(demoLoginEnabled(), false);
process.env.AUTH_ALLOW_DEMO = "true";
assert.equal(demoLoginEnabled(), true);
if (prevId === undefined) delete process.env.AUTH_GOOGLE_ID;
else process.env.AUTH_GOOGLE_ID = prevId;
if (prevSecret === undefined) delete process.env.AUTH_GOOGLE_SECRET;
else process.env.AUTH_GOOGLE_SECRET = prevSecret;
if (prevDemo === undefined) delete process.env.AUTH_ALLOW_DEMO;
else process.env.AUTH_ALLOW_DEMO = prevDemo;

console.log("ok period, ics, scale hints e auth-mode");
