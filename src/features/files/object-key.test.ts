import { describe, expect, it } from "vitest";

import { contentTypeFor, makeObjectKey } from "./object-key";

describe("makeObjectKey", () => {
    it("keeps a clean name and appends a hex suffix before the extension", () => {
        expect(makeObjectKey("login-flow.png")).toMatch(/^login-flow-[0-9a-f]{6}\.png$/);
    });

    it("slugifies spaces, punctuation and uppercase", () => {
        expect(makeObjectKey("Login Flow (v2).PNG")).toMatch(/^login-flow-v2-[0-9a-f]{6}\.png$/);
    });

    it("strips accents instead of dropping the letters", () => {
        expect(makeObjectKey("café menu.pdf")).toMatch(/^cafe-menu-[0-9a-f]{6}\.pdf$/);
    });

    it("handles a name without an extension", () => {
        expect(makeObjectKey("Makefile")).toMatch(/^makefile-[0-9a-f]{6}$/);
    });

    it("treats a leading dot as part of the name, not an extension", () => {
        expect(makeObjectKey(".env")).toMatch(/^env-[0-9a-f]{6}$/);
    });

    it("falls back to 'file' when nothing survives slugification", () => {
        expect(makeObjectKey("!!!.png")).toMatch(/^file-[0-9a-f]{6}\.png$/);
    });

    it("truncates very long names", () => {
        const key = makeObjectKey(`${"a".repeat(300)}.png`);
        expect(key.length).toBeLessThanOrEqual(80 + "-abc123.png".length);
    });

    it("generates a different suffix per call", () => {
        expect(makeObjectKey("a.png")).not.toBe(makeObjectKey("a.png"));
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
