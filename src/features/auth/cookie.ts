import "server-only";
import { cookies } from "next/headers";

import { env } from "@/lib/env/server";

import { createSession, SESSION_TTL_SECONDS, verifySession } from "./session";

const isProd = process.env.NODE_ENV === "production";

// __Host- makes the browser reject the cookie unless it is Secure, host-only and path=/. Dev runs on plain http.
const SESSION_COOKIE = isProd ? "__Host-session" : "session";
const COOKIE_OPTIONS = { httpOnly: true, secure: isProd, sameSite: "lax", path: "/" } as const;

/**
 * The only auth check for the drive. Pages and server actions call it themselves because the proxy is not a security
 * boundary.
 */
export async function isSignedIn() {
    return verifySession((await cookies()).get(SESSION_COOKIE)?.value, env.UPLOAD_TOKEN);
}

export async function startSession() {
    (await cookies()).set(SESSION_COOKIE, createSession(env.UPLOAD_TOKEN), {
        ...COOKIE_OPTIONS,
        maxAge: SESSION_TTL_SECONDS,
    });
}

// Not cookies().delete(): the browser ignores a __Host- cookie update that lacks Secure and path=/.
export async function endSession() {
    (await cookies()).set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
