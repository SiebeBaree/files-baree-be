"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { requestUpload } from "./actions";
import { copyLink } from "./copy-link";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "./schema";

export type Upload = {
    id: string;
    name: string;
    size: number;
    loaded: number;
    status: "uploading" | "done" | "failed";
    error?: string;
    key?: string;
    /** Object URL of a local image, the tray's thumbnail while the file is on its way. */
    preview?: string;
};

function put(url: string, file: File, signal: AbortSignal, onProgress: (loaded: number) => void) {
    return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        xhr.upload.addEventListener("progress", (event) => onProgress(event.loaded));
        xhr.addEventListener("load", () =>
            xhr.status < 300 ? resolve() : reject(new Error(`Storage rejected the upload (${xhr.status}).`)),
        );
        // A CORS rejection is indistinguishable from a network error here.
        xhr.addEventListener("error", () =>
            reject(new Error("Could not reach storage. Check the bucket's CORS rule.")),
        );
        xhr.addEventListener("abort", () => reject(signal.reason));
        signal.addEventListener("abort", () => xhr.abort());
        xhr.send(file);
    });
}

/**
 * Uploads the way agents do: the server presigns, then the browser PUTs the bytes straight to R2. XHR because fetch
 * cannot report upload progress. A lone file gets its link copied when it lands, since that link is why it was uploaded.
 */
export function useUploads() {
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [uploads, setUploads] = useState<Upload[]>([]);
    const controllers = useRef(new Map<string, AbortController>());

    function update(id: string, patch: Partial<Upload>) {
        setUploads((list) => list.map((upload) => (upload.id === id ? { ...upload, ...patch } : upload)));
    }

    async function send(file: File, id: string, copyWhenDone: boolean) {
        if (file.size === 0) return update(id, { status: "failed", error: "The file is empty." });
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return update(id, { status: "failed", error: `Larger than the ${MAX_FILE_SIZE_MB} MB limit.` });
        }

        const controller = new AbortController();
        controllers.current.set(id, controller);
        try {
            const presigned = await requestUpload({ filename: file.name, size: file.size }).catch(() => ({
                error: "Could not start the upload. Try again.",
            }));
            if ("error" in presigned) return update(id, { status: "failed", error: presigned.error });
            controller.signal.throwIfAborted();

            await put(presigned.uploadUrl, file, controller.signal, (loaded) => update(id, { loaded }));
            update(id, { status: "done", loaded: file.size, key: presigned.key });
            startTransition(() => router.refresh());
            if (copyWhenDone) await copyLink(presigned.key, { quiet: true });
        } catch (error) {
            if (controller.signal.aborted) return;
            update(id, { status: "failed", error: error instanceof Error ? error.message : "Upload failed." });
        } finally {
            controllers.current.delete(id);
        }
    }

    function uploadFiles(files: File[]) {
        const batch = files.map((file) => ({
            file,
            upload: {
                id: crypto.randomUUID(),
                name: file.name,
                size: file.size,
                loaded: 0,
                status: "uploading",
                preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
            } satisfies Upload,
        }));
        setUploads((list) => [...batch.map((entry) => entry.upload), ...list]);
        for (const { file, upload } of batch) void send(file, upload.id, batch.length === 1);
    }

    /** Cancels an upload in flight or hides a finished one. */
    function dismiss(id: string) {
        controllers.current.get(id)?.abort();
        const preview = uploads.find((upload) => upload.id === id)?.preview;
        if (preview) URL.revokeObjectURL(preview);
        setUploads((list) => list.filter((upload) => upload.id !== id));
    }

    function clearFinished() {
        for (const upload of uploads) {
            if (upload.status !== "uploading" && upload.preview) URL.revokeObjectURL(upload.preview);
        }
        setUploads((list) => list.filter((upload) => upload.status === "uploading"));
    }

    return { uploads, uploadFiles, dismiss, clearFinished };
}
