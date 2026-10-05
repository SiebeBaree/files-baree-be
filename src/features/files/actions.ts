"use server";

import { refresh } from "next/cache";
import { z } from "zod";

import { isSignedIn } from "@/features/auth";

import { createUpload } from "./create-upload";
import { TEXT_PREVIEW_BYTES } from "./file-info";
import { OBJECT_KEY_PATTERN } from "./object-key";
import { deleteObject, readObjectStart } from "./r2";
import { createUploadSchema, type CreateUpload } from "./schema";

const SIGNED_OUT = { error: "You are signed out. Reload the page to sign in again." };
const NOT_FOUND = { error: "That file does not exist." };
const keySchema = z.string().regex(OBJECT_KEY_PATTERN);

/** Presigns an upload from the drive. The browser then PUTs the file straight to R2, same as the API flow. */
export async function requestUpload(input: CreateUpload) {
    if (!(await isSignedIn())) return SIGNED_OUT;
    const parsed = createUploadSchema.safeParse(input);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "This file cannot be uploaded." };
    return createUpload(parsed.data);
}

export async function deleteFile(key: string) {
    if (!(await isSignedIn())) return SIGNED_OUT;
    const parsed = keySchema.safeParse(key);
    if (!parsed.success) return NOT_FOUND;
    await deleteObject(parsed.data);
    refresh();
}

/** The start of a text file for the preview. Read server side so the bucket's CORS rule only needs to allow PUT. */
export async function readTextPreview(key: string) {
    if (!(await isSignedIn())) return SIGNED_OUT;
    const parsed = keySchema.safeParse(key);
    if (!parsed.success) return NOT_FOUND;
    return { text: await readObjectStart(parsed.data, TEXT_PREVIEW_BYTES) };
}
