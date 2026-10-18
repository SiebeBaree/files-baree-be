import { type NextRequest, NextResponse } from "next/server";

import { OBJECT_KEY_PATTERN, presignDownload } from "@/features/files";

/**
 * Serves uploaded files without a public bucket: redirect to a short-lived presigned R2 GET. The public_url stays
 * stable while the signed target is minted per request, and no-store keeps caches from holding an expired redirect.
 * Add ?download to get the file as an attachment instead of rendered in the browser. A catch-all because keys carry
 * their retention as a path segment, "/30d/login-flow-b6f9ac.png", next to the older unprefixed ones.
 */
export async function GET(request: NextRequest, { params }: RouteContext<"/[...key]">) {
    const key = (await params).key.join("/");
    // Anything that does not match was never uploaded here, so it 404s before signing.
    if (!OBJECT_KEY_PATTERN.test(key)) {
        return new NextResponse("Not found", { status: 404 });
    }
    const disposition = request.nextUrl.searchParams.has("download") ? "attachment" : "inline";
    return NextResponse.redirect(await presignDownload(key, disposition), {
        status: 302,
        headers: { "Cache-Control": "no-store" },
    });
}
