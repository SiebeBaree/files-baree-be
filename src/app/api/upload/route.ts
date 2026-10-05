import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { tokenMatches } from "@/features/auth";
import { createUpload, createUploadSchema } from "@/features/files";
import { env } from "@/lib/env/server";
import { siteUrl } from "@/lib/site";

const EXAMPLE_REQUEST = `curl --fail-with-body -X PUT ${siteUrl.href} -H 'Authorization: Bearer <UPLOAD_TOKEN>' -d '{"filename": "login-flow.png", "size": 48213}'`;

// The public API is PUT /; proxy.ts rewrites that here because a route handler cannot share / with the drive page.
export async function PUT(request: NextRequest) {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token || !tokenMatches(token, env.UPLOAD_TOKEN)) {
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

    const upload = await createUpload(parsed.data);
    if ("error" in upload) {
        return NextResponse.json(
            {
                error: upload.error,
                fix: `Do not retry before the reset. Tell the user, who can free space by deleting files at ${siteUrl.href}.`,
            },
            { status: 429 },
        );
    }

    return NextResponse.json({ upload_url: upload.uploadUrl, public_url: upload.publicUrl });
}
