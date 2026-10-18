import { describe, expect, it } from "vitest";

import { daysLeft, expiresAt, fileKind } from "./file-info";

describe("fileKind", () => {
    it("groups by content type", () => {
        expect(fileKind("shot-b6f9ac.png")).toBe("image");
        expect(fileKind("demo-b6f9ac.mov")).toBe("video");
        expect(fileKind("review-b6f9ac.pdf")).toBe("document");
        expect(fileKind("trace-b6f9ac.json")).toBe("document");
        expect(fileKind("assets-b6f9ac.zip")).toBe("other");
        expect(fileKind("makefile-b6f9ac")).toBe("other");
    });
});

describe("expiresAt", () => {
    const uploadedAt = new Date("2026-10-05T12:00:00Z");

    it("adds the retention from the key prefix", () => {
        expect(expiresAt("30d/shot-b6f9ac.png", uploadedAt)).toEqual(new Date("2026-11-04T12:00:00Z"));
        expect(expiresAt("90d/shot-b6f9ac.png", uploadedAt)).toEqual(new Date("2027-01-03T12:00:00Z"));
    });

    it("never expires forever files or the unprefixed files no lifecycle rule matches", () => {
        expect(expiresAt("forever/shot-b6f9ac.png", uploadedAt)).toBeUndefined();
        expect(expiresAt("shot-b6f9ac.png", uploadedAt)).toBeUndefined();
    });
});

describe("daysLeft", () => {
    const expires = new Date("2026-11-04T12:00:00Z");

    it("rounds partial days up, so the last day reads 1 and not 0", () => {
        expect(daysLeft(expires, new Date("2026-11-04T11:00:00Z").getTime())).toBe(1);
    });

    it("never goes negative when the lifecycle rule runs late", () => {
        expect(daysLeft(expires, new Date("2026-11-05T12:00:00Z").getTime())).toBe(0);
    });
});
