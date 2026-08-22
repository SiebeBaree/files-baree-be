import { timingSafeEqual } from "node:crypto";

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createUploadSchema, makeObjectKey, presignUpload } from "@/features/uploads";
import { env } from "@/lib/env/server";
import { siteUrl } from "@/lib/site";

const EXAMPLE_REQUEST = `curl --fail-with-body -X PUT ${siteUrl.href} -H 'Authorization: Bearer <UPLOAD_TOKEN>' -d '{"filename": "login-flow.png", "size": 48213}'`;

// Timing-safe so the token cannot be guessed byte by byte from response times.
function isAuthorized(request: NextRequest) {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return false;
    const expected = Buffer.from(env.UPLOAD_TOKEN);
    const received = Buffer.from(token);
    return received.length === expected.length && timingSafeEqual(received, expected);
}

// The public API is PUT /; proxy.ts rewrites that here because a route handler cannot share / with the landing page.
export async function PUT(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json(
            {
                error: "Unauthorized: missing or invalid bearer token.",
                fix: `Send an 'Authorization: Bearer <UPLOAD_TOKEN>' header, where UPLOAD_TOKEN is this deployment's upload secret (ask the owner if you do not have it). Example: ${EXAMPLE_REQUEST}`,
            },
            { status: 401 },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            {
                error: "Request body is not valid JSON.",
                fix: `Send a JSON object with filename and size, where size is the file's exact byte count (wc -c < yourfile). Example: ${EXAMPLE_REQUEST}`,
            },
            { status: 400 },
        );
    }

    const parsed = createUploadSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Invalid request body. Each field error below says how to fix it.",
                field_errors: z.flattenError(parsed.error).fieldErrors,
                fix: `Example of a valid request: ${EXAMPLE_REQUEST}. After this succeeds, PUT the raw file bytes to the upload_url in the response (curl --fail-with-body -T yourfile '<upload_url>'), then share public_url. The upload must be exactly size bytes; a 403 SignatureDoesNotMatch from the upload_url means the size you posted does not match the file.`,
            },
            { status: 400 },
        );
    }

    const { filename, size } = parsed.data;
    const key = makeObjectKey(filename);

    return NextResponse.json({
        upload_url: await presignUpload(key, size),
        public_url: new URL(`/${key}`, siteUrl).href,
    });
}
