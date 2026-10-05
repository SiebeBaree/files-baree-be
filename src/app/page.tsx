import { connection } from "next/server";

import { isSignedIn, SignIn, signOut } from "@/features/auth";
import { Drive, listFiles, monthlyUsage } from "@/features/files";

export default async function HomePage() {
    // Nonce-based CSP requires dynamic rendering (see proxy.ts).
    await connection();
    if (!(await isSignedIn())) return <SignIn />;

    const files = await listFiles();
    return <Drive files={files} usage={monthlyUsage(files)} signOut={signOut} />;
}
