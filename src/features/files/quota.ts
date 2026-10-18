import type { StoredFile } from "./list-objects";

export const STORAGE_LIMIT_GB = 100;
export const STORAGE_LIMIT_BYTES = STORAGE_LIMIT_GB * 1024 ** 3;

/**
 * Bytes in the bucket, counted from a listing so deleting or expiring a file gives its bytes back. Presigned uploads
 * that have not landed yet do not count; the overshoot is bounded by the uploads in flight.
 */
export function storageUsage(files: StoredFile[]) {
    return { used: files.reduce((sum, file) => sum + file.size, 0), limit: STORAGE_LIMIT_BYTES };
}

export type StorageUsage = ReturnType<typeof storageUsage>;
