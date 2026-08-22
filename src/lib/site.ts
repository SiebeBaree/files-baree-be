import "server-only";
import { env } from "@/lib/env/server";

export const siteName = "files.baree.be";
export const siteDescription = "Personal file host. Upload with curl, link the file in a GitHub PR.";
export const siteUrl = new URL(env.APP_URL ?? "http://localhost:3000");
