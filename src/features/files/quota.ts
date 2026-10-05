import type { StoredFile } from "./list-objects";

export const MONTHLY_QUOTA_GB = 50;
export const MONTHLY_QUOTA_BYTES = MONTHLY_QUOTA_GB * 1024 ** 3;

/**
 * Bytes uploaded this calendar month (UTC), counted from what is in the bucket, so deleting a file gives its bytes
 * back. Presigned uploads that have not landed yet do not count; the overshoot is bounded by the uploads in flight.
 */
export function monthlyUsage(files: StoredFile[], now = new Date()) {
    const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
    return {
        used: files.reduce((sum, file) => (file.uploadedAt.getTime() >= monthStart ? sum + file.size : sum), 0),
        limit: MONTHLY_QUOTA_BYTES,
        resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
    };
}

export type MonthlyUsage = ReturnType<typeof monthlyUsage>;
