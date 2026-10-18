import { describe, expect, it } from "vitest";

import { contentTypeFor, makeObjectKey, OBJECT_KEY_PATTERN } from "./object-key";

describe("makeObjectKey", () => {
    it("keeps a clean name and appends a hex suffix before the extension", () => {
        expect(makeObjectKey("login-flow.png", "30d")).toMatch(/^30d\/login-flow-[0-9a-f]{6}\.png$/);
    });

    it("slugifies spaces, punctuation and uppercase", () => {
        expect(makeObjectKey("Login Flow (v2).PNG", "30d")).toMatch(/^30d\/login-flow-v2-[0-9a-f]{6}\.png$/);
    });

    it("strips accents instead of dropping the letters", () => {
        expect(makeObjectKey("café menu.pdf", "30d")).toMatch(/^30d\/cafe-menu-[0-9a-f]{6}\.pdf$/);
    });

    it("handles a name without an extension", () => {
        expect(makeObjectKey("Makefile", "30d")).toMatch(/^30d\/makefile-[0-9a-f]{6}$/);
    });

    it("treats a leading dot as part of the name, not an extension", () => {
        expect(makeObjectKey(".env", "30d")).toMatch(/^30d\/env-[0-9a-f]{6}$/);
    });

    it("falls back to 'file' when nothing survives slugification", () => {
        expect(makeObjectKey("!!!.png", "30d")).toMatch(/^30d\/file-[0-9a-f]{6}\.png$/);
    });

    it("truncates very long names", () => {
        const key = makeObjectKey(`${"a".repeat(300)}.png`, "30d");
        expect(key.length).toBeLessThanOrEqual("30d/".length + 80 + "-abc123.png".length);
    });

    it("generates a different suffix per call", () => {
        expect(makeObjectKey("a.png", "30d")).not.toBe(makeObjectKey("a.png", "30d"));
    });
});

describe("OBJECT_KEY_PATTERN", () => {
    it("accepts generated keys and the unprefixed keys from before retention", () => {
        expect(OBJECT_KEY_PATTERN.test(makeObjectKey("a.png", "forever"))).toBe(true);
        expect(OBJECT_KEY_PATTERN.test("login-flow-b6f9ac.png")).toBe(true);
    });

    it("rejects any other path", () => {
        expect(OBJECT_KEY_PATTERN.test("7d/a.png")).toBe(false);
        expect(OBJECT_KEY_PATTERN.test("30d/../a.png")).toBe(false);
        expect(OBJECT_KEY_PATTERN.test("30d/30d/a.png")).toBe(false);
    });
});

describe("contentTypeFor", () => {
    it("maps known extensions case-insensitively", () => {
        expect(contentTypeFor("shot.PNG")).toBe("image/png");
        expect(contentTypeFor("demo.mp4")).toBe("video/mp4");
    });

    it("falls back to octet-stream for unknown extensions", () => {
        expect(contentTypeFor("data.xyz")).toBe("application/octet-stream");
        expect(contentTypeFor("noextension")).toBe("application/octet-stream");
    });
});
