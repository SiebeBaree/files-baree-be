import { describe, expect, it } from "vitest";

import { monthlyUsage } from "./quota";

const file = (uploadedAt: string, size: number) => ({ key: "a.png", size, uploadedAt: new Date(uploadedAt) });

describe("monthlyUsage", () => {
    it("counts only files uploaded since the start of the UTC month", () => {
        const files = [
            file("2026-09-30T23:59:59.999Z", 1000),
            file("2026-10-01T00:00:00.000Z", 20),
            file("2026-10-05T12:00:00.000Z", 3),
        ];
        expect(monthlyUsage(files, new Date("2026-10-05T13:00:00Z")).used).toBe(23);
    });

    it("resets on the first of next month, including across a year boundary", () => {
        expect(monthlyUsage([], new Date("2026-10-05T13:00:00Z")).resetsAt).toEqual(new Date("2026-11-01T00:00:00Z"));
        expect(monthlyUsage([], new Date("2026-12-31T23:00:00Z")).resetsAt).toEqual(new Date("2027-01-01T00:00:00Z"));
    });
});
