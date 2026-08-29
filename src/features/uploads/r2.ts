import "server-only";
import { AwsV4Signer } from "aws4fetch";

import { env } from "@/lib/env/server";

import { contentTypeFor } from "./object-key";

export const UPLOAD_URL_TTL_SECONDS = 3600;
const DOWNLOAD_URL_TTL_SECONDS = 300;

function signedObjectUrl(key: string, ttlSeconds: number) {
    const url = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${key}`);
    url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
    return url;
}

/**
 * Presigns a PUT to R2. The caller uploads straight to R2 because Vercel caps request bodies at 4.5 MB, far below our
 * 400 MB limit. Content-Length is part of the signature (allHeaders opts it in, aws4fetch skips it by default), so R2
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
 * still renders the file instead of downloading it.
 */
export async function presignDownload(key: string) {
    const url = signedObjectUrl(key, DOWNLOAD_URL_TTL_SECONDS);
    url.searchParams.set("response-content-type", contentTypeFor(key));
    url.searchParams.set("response-content-disposition", "inline");

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
