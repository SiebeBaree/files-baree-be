import { connection } from "next/server";

export default async function HomePage() {
    // Nonce-based CSP requires dynamic rendering (see proxy.ts).
    await connection();

    return (
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-6">
            <h1 className="text-3xl font-semibold tracking-tight">files.baree.be</h1>
            <p className="text-muted-foreground">
                Personal file host for linking screenshots and recordings in GitHub PRs. Uploading takes two commands:
                the first returns a URL to upload the file to, the second uploads it there.
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
                {`# 1. request an upload URL for your file
curl -X PUT https://files.baree.be/ \\
  -H "Authorization: Bearer $UPLOAD_TOKEN" \\
  -d "{\\"filename\\": \\"login-flow.png\\", \\"size\\": $(wc -c < login-flow.png)}"
# => { "upload_url": "...", "public_url": "..." }

# 2. upload the file to upload_url, then share public_url
curl -T login-flow.png '<upload_url>'`}
            </pre>
        </main>
    );
}
