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

// Everything makeObjectKey produces matches this. Keys from outside are checked against it before they reach an R2 URL,
// where a "/" or ".." would point somewhere else in the bucket or account.
export const OBJECT_KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,90}(\.[a-z0-9]{1,16})?$/;

/** "Login Flow (v2).PNG" becomes "login-flow-v2-b6f9ac.png": slugified base, random hex suffix, lowercased extension. */
export function makeObjectKey(filename: string): string {
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

    return extension ? `${base}-${suffix}.${extension}` : `${base}-${suffix}`;
}

/** Content type for a key or filename by extension, so browsers render the file instead of downloading it. */
export function contentTypeFor(filename: string): string {
    const extension = filename.slice(filename.lastIndexOf(".") + 1).toLowerCase();
    return EXTENSION_CONTENT_TYPES[extension] ?? "application/octet-stream";
}
