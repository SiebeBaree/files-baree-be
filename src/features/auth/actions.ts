"use server";

import { refresh } from "next/cache";

import { env } from "@/lib/env/server";

import { endSession, startSession } from "./cookie";
import { tokenMatches } from "./session";

/** Signs in with the upload token. Returns an error message for useActionState, or re-renders the page signed in. */
export async function signIn(_previous: string | undefined, formData: FormData) {
    const token = formData.get("token");
    if (typeof token !== "string" || !tokenMatches(token, env.UPLOAD_TOKEN)) {
        return "That token is not right.";
    }
    await startSession();
    refresh();
}

export async function signOut() {
    await endSession();
    refresh();
}
