import { describe, expect, it } from "vitest";

import { daysLeft, fileKind } from "./file-info";

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

describe("daysLeft", () => {
    const uploadedAt = new Date("2026-10-05T12:00:00Z");

    it("counts the full retention right after upload", () => {
        expect(daysLeft(uploadedAt, uploadedAt.getTime())).toBe(90);
    });

    it("rounds partial days up, so the last day reads 1 and not 0", () => {
        expect(daysLeft(uploadedAt, new Date("2027-01-03T11:00:00Z").getTime())).toBe(1);
    });

    it("never goes negative when the lifecycle rule runs late", () => {
        expect(daysLeft(uploadedAt, new Date("2027-01-04T12:00:00Z").getTime())).toBe(0);
    });
});
