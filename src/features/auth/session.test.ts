import { describe, expect, it } from "vitest";

import { createSession, SESSION_TTL_SECONDS, tokenMatches, verifySession } from "./session";

const SECRET = "a-long-enough-upload-token";
const NOW = Date.UTC(2026, 9, 5);

describe("tokenMatches", () => {
    it("accepts the exact secret only", () => {
        expect(tokenMatches(SECRET, SECRET)).toBe(true);
        expect(tokenMatches(`${SECRET} `, SECRET)).toBe(false);
        expect(tokenMatches("", SECRET)).toBe(false);
    });
});

describe("verifySession", () => {
    it("accepts a fresh session", () => {
        expect(verifySession(createSession(SECRET, NOW), SECRET, NOW)).toBe(true);
    });

    it("rejects an expired session", () => {
        const session = createSession(SECRET, NOW);
        expect(verifySession(session, SECRET, NOW + SESSION_TTL_SECONDS * 1000)).toBe(false);
    });

    it("rejects a session signed with another token, so rotating the token signs everyone out", () => {
        expect(verifySession(createSession("another-upload-token", NOW), SECRET, NOW)).toBe(false);
    });

    it("rejects an extended expiry with the original signature", () => {
        const [expiry, signature] = createSession(SECRET, NOW).split(".");
        expect(verifySession(`${Number(expiry) + 3600}.${signature}`, SECRET, NOW)).toBe(false);
    });

    it("rejects missing and malformed values", () => {
        for (const value of [undefined, "", "123", ".abc", "abc.def", "1.2.3", `-1.${"x".repeat(43)}`]) {
            expect(verifySession(value, SECRET, NOW)).toBe(false);
        }
    });
});
