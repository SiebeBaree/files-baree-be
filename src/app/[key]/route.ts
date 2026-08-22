import { NextResponse } from "next/server";

import { presignDownload } from "@/features/uploads";

// Everything makeObjectKey produces matches this. Anything else was never uploaded here, so it 404s before signing.
const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,90}(\.[a-z0-9]{1,16})?$/;

/**
 * Serves uploaded files without a public bucket: redirect to a short-lived presigned R2 GET. The public_url stays
 * stable while the signed target is minted per request, and no-store keeps caches from holding an expired redirect.
 */
export async function GET(_request: Request, { params }: RouteContext<"/[key]">) {
    const { key } = await params;
    if (!KEY_PATTERN.test(key)) {
        return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.redirect(await presignDownload(key), {
        status: 302,
        headers: { "Cache-Control": "no-store" },
    });
}
