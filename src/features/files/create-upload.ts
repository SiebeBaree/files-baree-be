import "server-only";
import { formatBytes } from "@/lib/format";
import { siteUrl } from "@/lib/site";

import { makeObjectKey } from "./object-key";
import { monthlyUsage } from "./quota";
import { listFiles, presignUpload } from "./r2";
import type { CreateUpload } from "./schema";

/**
 * Checks the monthly quota and presigns an upload. The API and the drive both go through here so they enforce the same
 * limits. A full quota is an expected outcome, so it comes back as an error message instead of a throw.
 */
export async function createUpload({ filename, size }: CreateUpload) {
    const { used, limit, resetsAt } = monthlyUsage(await listFiles());
    if (used + size > limit) {
        const reset = resetsAt.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
        return {
            error: `Monthly upload limit reached: ${formatBytes(used)} of ${formatBytes(limit)} used and this file is ${formatBytes(size)}. The limit resets on ${reset}.`,
        };
    }

    const key = makeObjectKey(filename);
    return { key, uploadUrl: await presignUpload(key, size), publicUrl: new URL(`/${key}`, siteUrl).href };
}
