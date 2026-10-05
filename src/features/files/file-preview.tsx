"use client";

import { useEffect, useState } from "react";

import { readTextPreview } from "./actions";
import { isText, TEXT_PREVIEW_BYTES } from "./file-info";
import { FileTypeIcon } from "./file-thumb";
import type { StoredFile } from "./list-objects";
import { contentTypeFor } from "./object-key";

function TextPreview({ file }: { file: StoredFile }) {
    const [result, setResult] = useState<{ key: string; text?: string; error?: string }>();

    useEffect(() => {
        let current = true;
        readTextPreview(file.key).then(
            (preview) => current && setResult({ key: file.key, ...preview }),
            () => current && setResult({ key: file.key, error: "Could not load the preview." }),
        );
        return () => {
            current = false;
        };
    }, [file.key]);

    // A result for the previous file stays hidden while the next one loads.
    const loaded = result?.key === file.key ? result : undefined;
    if (loaded?.error) return <p className="text-muted-foreground">{loaded.error}</p>;

    return (
        <div className="w-full max-w-[680px] self-start">
            <div className="overflow-auto rounded bg-white py-3.5 font-mono text-[12.5px] leading-[1.75] whitespace-pre shadow-[0_0_0_1px_rgb(15_15_15/0.1)]">
                {loaded?.text?.split("\n").map((line, index) => (
                    // Lines have no identity beyond their position.
                    // oxlint-disable-next-line react/no-array-index-key
                    <div key={index} className="pr-4">
                        <span className="inline-block w-11 pr-4 text-right text-faint select-none">{index + 1}</span>
                        {line}
                    </div>
                ))}
            </div>
            {loaded && file.size > TEXT_PREVIEW_BYTES && (
                <p className="mt-2 text-xs text-muted-foreground">
                    Showing the first 64 KB. Open the original for the rest.
                </p>
            )}
        </div>
    );
}

/** The biggest useful rendering of a file: media plays, PDFs embed, text gets line numbers. */
export function FilePreview({ file }: { file: StoredFile }) {
    const type = contentTypeFor(file.key);
    const src = `/${file.key}`;

    if (type.startsWith("image/")) {
        return (
            // oxlint-disable-next-line nextjs/no-img-element -- R2 serves the original, as with thumbnails
            <img
                src={src}
                alt={file.key}
                draggable={false}
                className="max-h-full max-w-full rounded-sm object-contain shadow-[0_0_0_1px_rgb(15_15_15/0.1),0_4px_16px_rgb(15_15_15/0.08)]"
            />
        );
    }
    if (type.startsWith("video/")) {
        // Screen recordings have no captions to offer.
        // oxlint-disable-next-line jsx-a11y/media-has-caption
        return <video src={src} controls playsInline className="max-h-full max-w-full rounded-sm bg-black" />;
    }
    if (type === "application/pdf") {
        // The PDF loads from R2's origin, so the same-origin policy already isolates it. A sandbox would also block
        // Chrome's PDF viewer.
        // oxlint-disable-next-line react/iframe-missing-sandbox
        return <iframe src={src} title={file.key} className="size-full min-h-[60vh] rounded-sm bg-white" />;
    }
    if (isText(file.key)) return <TextPreview file={file} />;

    return (
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <FileTypeIcon name={file.key} className="mb-1.5 h-[84px] w-[72px]" />
            No preview for this file type
        </div>
    );
}
