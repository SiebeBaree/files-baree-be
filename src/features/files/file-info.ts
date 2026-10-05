import { contentTypeFor } from "./object-key";

// Mirrors the R2 lifecycle rule on the bucket, which does the deleting. The app only uses it to show when files expire.
export const RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export const TEXT_PREVIEW_BYTES = 64 * 1024;

export const FILE_KINDS = ["image", "video", "document", "other"] as const;
export type FileKind = (typeof FILE_KINDS)[number];
export type KindFilter = FileKind | "all";

export function fileKind(key: string): FileKind {
    const type = contentTypeFor(key);
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (isText(key) || type === "application/pdf") return "document";
    return "other";
}

/** Text files get a code-style preview instead of whatever the browser does with their content type. */
export function isText(key: string) {
    const type = contentTypeFor(key);
    return type.startsWith("text/") || type === "application/json";
}

export function expiresAt(uploadedAt: Date) {
    return new Date(uploadedAt.getTime() + RETENTION_DAYS * DAY_MS);
}

/** Whole days until the lifecycle rule deletes the file. 0 means today. */
export function daysLeft(uploadedAt: Date, now: number) {
    return Math.max(0, Math.ceil((expiresAt(uploadedAt).getTime() - now) / DAY_MS));
}

/** "Oct 5" within the current year, "Dec 28, 2025" otherwise. */
export function formatDay(date: Date, now: number) {
    const year = date.getFullYear() === new Date(now).getFullYear() ? undefined : "numeric";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year });
}
