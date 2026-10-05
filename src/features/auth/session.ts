import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

function sha256(value: string) {
    return createHash("sha256").update(value).digest();
}

/** Compares hashes so neither the content nor the length of the secret leaks through response times. */
export function tokenMatches(candidate: string, secret: string) {
    return timingSafeEqual(sha256(candidate), sha256(secret));
}

function sign(expiry: string, secret: string) {
    return createHmac("sha256", secret).update(`session:${expiry}`).digest("base64url");
}

/**
 * A session is "<expiry>.<HMAC of the expiry>" keyed by the upload token. Nothing is stored server side, so rotating
 * UPLOAD_TOKEN is how every browser gets signed out.
 */
export function createSession(secret: string, now = Date.now()) {
    const expiry = String(Math.floor(now / 1000) + SESSION_TTL_SECONDS);
    return `${expiry}.${sign(expiry, secret)}`;
}

export function verifySession(value: string | undefined, secret: string, now = Date.now()) {
    const [expiry, signature, ...rest] = value?.split(".") ?? [];
    if (!expiry || !signature || rest.length > 0 || !/^\d{1,12}$/.test(expiry)) return false;
    return Number(expiry) * 1000 > now && tokenMatches(signature, sign(expiry, secret));
}
