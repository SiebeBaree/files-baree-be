import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createUploadSchema, MAX_FILE_SIZE_BYTES } from "./schema";

function firstError(input: unknown, field: "filename" | "size") {
    const result = createUploadSchema.safeParse(input);
    if (result.success) throw new Error("expected parse to fail");
    return z.flattenError(result.error).fieldErrors[field]?.[0] ?? "";
}

describe("createUploadSchema", () => {
    it("accepts a minimal valid body", () => {
        const result = createUploadSchema.parse({ filename: "login-flow.png", size: 48213 });
        expect(result).toEqual({ filename: "login-flow.png", size: 48213 });
    });

    it("tells the agent how to produce a missing size", () => {
        expect(firstError({ filename: "a.png" }, "size")).toContain("wc -c");
    });

    it("rejects a fractional size", () => {
        expect(firstError({ filename: "a.png", size: 12.5 }, "size")).toContain("integer");
    });

    it("rejects a zero size", () => {
        expect(firstError({ filename: "a.png", size: 0 }, "size")).toContain("greater than 0");
    });

    it("names both the actual size and the limit when the file is too large", () => {
        const message = firstError({ filename: "a.png", size: MAX_FILE_SIZE_BYTES + 1 }, "size");
        expect(message).toContain(String(MAX_FILE_SIZE_BYTES + 1));
        expect(message).toContain("200 MB");
    });

    it("rejects an empty filename with an example", () => {
        expect(firstError({ filename: "", size: 1 }, "filename")).toContain("login-flow.png");
    });
});
