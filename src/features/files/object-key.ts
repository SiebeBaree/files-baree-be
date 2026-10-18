const EXTENSION_CONTENT_TYPES: Record<string, string> = {
    avif: "image/avif",
    csv: "text/csv",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    json: "application/json",
    md: "text/markdown",
    mov: "video/quicktime",
    mp4: "video/mp4",
    pdf: "application/pdf",
    png: "image/png",
    svg: "image/svg+xml",
    txt: "text/plain",
    webm: "video/webm",
    webp: "image/webp",
    zip: "application/zip",
};

/**
 * How long a file lives, stored as the first segment of its key: "30d/login-flow-b6f9ac.png". R2 lifecycle rules can
 * only match a prefix, so the bucket has one rule per prefix doing the deleting and none for forever.
 */
export const RETENTIONS = ["30d", "60d", "90d", "forever"] as const;
export type Retention = (typeof RETENTIONS)[number];

// Everything makeObjectKey produces matches this. Keys from outside are checked against it before they reach an R2 URL,
// where any other "/" or a ".." would point somewhere else in the bucket or account. The prefix is optional because
// files uploaded before retention existed live at the root of the bucket.
export const OBJECT_KEY_PATTERN = new RegExp(
    `^(?:(${RETENTIONS.join("|")})/)?[a-z0-9][a-z0-9-]{0,90}(\\.[a-z0-9]{1,16})?$`,
);

/** No lifecycle rule matches the unprefixed keys from before retention existed, so they stay until deleted. */
export function retentionOf(key: string): Retention {
    return RETENTIONS.find((retention) => key.startsWith(`${retention}/`)) ?? "forever";
}

/** The key without its retention prefix: what the drive shows as the file's name. */
export function displayName(key: string) {
    return key.slice(key.indexOf("/") + 1);
}

/**
 * "Login Flow (v2).PNG" kept for 30 days becomes "30d/login-flow-v2-b6f9ac.png": retention prefix, slugified base,
 * random hex suffix, lowercased extension.
 */
export function makeObjectKey(filename: string, retention: Retention): string {
    const dot = filename.lastIndexOf(".");
    const rawBase = dot > 0 ? filename.slice(0, dot) : filename;
    const rawExtension = dot > 0 ? filename.slice(dot + 1) : "";

    const base =
        rawBase
            // NFKD splits accented letters into letter plus combining mark, so "café" slugs to "cafe" not "caf".
            .normalize("NFKD")
            .replaceAll(/[\u{0300}-\u{036f}]/gu, "")
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, "-")
            .replaceAll(/^-+|-+$/g, "")
            .slice(0, 80)
            .replace(/-+$/, "") || "file";
    const extension = rawExtension
        .toLowerCase()
        .replaceAll(/[^a-z0-9]/g, "")
        .slice(0, 16);

    const suffix = Array.from(crypto.getRandomValues(new Uint8Array(3)), (byte) =>
        byte.toString(16).padStart(2, "0"),
    ).join("");

    return `${retention}/${base}-${suffix}${extension ? `.${extension}` : ""}`;
}

/** Content type for a key or filename by extension, so browsers render the file instead of downloading it. */
export function contentTypeFor(filename: string): string {
    const extension = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
    return EXTENSION_CONTENT_TYPES[extension] ?? "application/octet-stream";
}
