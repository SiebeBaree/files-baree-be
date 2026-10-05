import { toast } from "sonner";

export function publicUrl(key: string) {
    return new URL(`/${key}`, location.origin).href;
}

/** Copies text and confirms with a toast. Returns false when the clipboard refuses, e.g. Safari outside a click. */
export async function copyText(text: string, message = "Copied", { quiet = false } = {}) {
    try {
        await navigator.clipboard.writeText(text);
        toast.success(message);
        return true;
    } catch {
        if (!quiet) toast.error("Could not copy to the clipboard");
        return false;
    }
}

export function copyLink(key: string, options?: { quiet?: boolean }) {
    return copyText(publicUrl(key), "Link copied", options);
}
