import "server-only";
import { formatBytes } from "@/lib/format";
import { siteUrl } from "@/lib/site";

import { expiresAt } from "./file-info";
import { makeObjectKey } from "./object-key";
import { storageUsage } from "./quota";
import { listFiles, presignUpload } from "./r2";
import type { CreateUpload } from "./schema";

/**
 * Checks the storage limit and presigns an upload. The API and the drive both go through here so they enforce the
 * same limits. A full bucket is an expected outcome, so it comes back as an error message instead of a throw.
 */
export async function createUpload({ filename, size, retention }: CreateUpload) {
    const { used, limit } = storageUsage(await listFiles());
    if (used + size > limit) {
        return {
            error: `Storage is full: ${formatBytes(used)} of ${formatBytes(limit)} used and this file is ${formatBytes(size)}.`,
        };
    }

    const key = makeObjectKey(filename, retention);
    return {
        key,
        uploadUrl: await presignUpload(key, size),
        publicUrl: new URL(`/${key}`, siteUrl).href,
        expiresAt: expiresAt(key, new Date()),
    };
}
