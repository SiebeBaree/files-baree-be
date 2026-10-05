import "server-only";
import { AwsClient, AwsV4Signer } from "aws4fetch";

import { env } from "@/lib/env/server";

import { parseListObjects, type StoredFile } from "./list-objects";
import { contentTypeFor } from "./object-key";

export const UPLOAD_URL_TTL_SECONDS = 3600;
const DOWNLOAD_URL_TTL_SECONDS = 300;

function bucketUrl(key?: string) {
    return new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}${key ? `/${key}` : ""}`);
}

function signedObjectUrl(key: string, ttlSeconds: number) {
    const url = bucketUrl(key);
    url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
    return url;
}

/**
 * Presigns a PUT to R2. The caller uploads straight to R2 because Vercel caps request bodies at 4.5 MB, far below our
 * 500 MB limit. Content-Length is part of the signature (allHeaders opts it in, aws4fetch skips it by default), so R2
 * rejects any upload that is not exactly `size` bytes. That signature is what enforces the size limit.
 */
export async function presignUpload(key: string, size: number) {
    const signer = new AwsV4Signer({
        url: signedObjectUrl(key, UPLOAD_URL_TTL_SECONDS).href,
        method: "PUT",
        headers: { "Content-Length": String(size) },
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: "s3",
        region: "auto",
        signQuery: true,
        allHeaders: true,
    });

    const signed = await signer.sign();
    return signed.url.href;
}

/**
 * Presigns a GET so the bucket can stay private; GET /<key> redirects here. response-content-type pins the served
 * content type from the file extension, so whatever Content-Type the uploader sent (curl -T sends none) the browser
 * still renders the file instead of downloading it, unless the caller asks for an attachment.
 */
export async function presignDownload(key: string, disposition: "inline" | "attachment" = "inline") {
    const url = signedObjectUrl(key, DOWNLOAD_URL_TTL_SECONDS);
    url.searchParams.set("response-content-type", contentTypeFor(key));
    url.searchParams.set("response-content-disposition", disposition);

    const signer = new AwsV4Signer({
        url: url.href,
        method: "GET",
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: "s3",
        region: "auto",
        signQuery: true,
    });

    const signed = await signer.sign();
    return signed.url.href;
}

function r2() {
    return new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: "s3",
        region: "auto",
    });
}

/** Every object in the bucket. ListObjectsV2 returns at most 1000 keys per page, so this follows the pages. */
export async function listFiles(continuationToken?: string): Promise<StoredFile[]> {
    const url = bucketUrl();
    url.searchParams.set("list-type", "2");
    if (continuationToken) url.searchParams.set("continuation-token", continuationToken);

    const response = await r2().fetch(url);
    if (!response.ok) throw new Error(`R2 ListObjectsV2 failed with ${response.status}: ${await response.text()}`);
    const page = parseListObjects(await response.text());
    return page.continuationToken ? [...page.files, ...(await listFiles(page.continuationToken))] : page.files;
}

export async function deleteObject(key: string) {
    const response = await r2().fetch(bucketUrl(key), { method: "DELETE" });
    if (!response.ok) throw new Error(`R2 DeleteObject failed with ${response.status}: ${await response.text()}`);
}

/** The first `bytes` bytes of an object as text, for previews of files too large to send whole. */
export async function readObjectStart(key: string, bytes: number) {
    const response = await r2().fetch(bucketUrl(key), { headers: { Range: `bytes=0-${bytes - 1}` } });
    if (!response.ok) throw new Error(`R2 GetObject failed with ${response.status}: ${await response.text()}`);
    return response.text();
}
