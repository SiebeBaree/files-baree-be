"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import { fileKind } from "./file-info";

/** A page with a folded corner and the extension, for files without a visual thumbnail. */
export function FileTypeIcon({ name, className }: { name: string; className?: string }) {
    const extension = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1, name.lastIndexOf(".") + 5) : "";
    return (
        <svg viewBox="0 0 48 56" aria-hidden className={className}>
            <path
                d="M11 3.5h18.5l11 11V49a3.5 3.5 0 0 1-3.5 3.5H11A3.5 3.5 0 0 1 7.5 49V7A3.5 3.5 0 0 1 11 3.5z"
                fill="#fff"
                stroke="rgb(55 53 47 / 0.26)"
                strokeWidth="1.25"
            />
            <path
                d="M29.5 3.75v7.75a3 3 0 0 0 3 3h7.75"
                fill="none"
                stroke="rgb(55 53 47 / 0.26)"
                strokeWidth="1.25"
                strokeLinejoin="round"
            />
            <path
                d="M15 20h18M15 25h18M15 30h11"
                stroke="rgb(55 53 47 / 0.3)"
                strokeWidth="1.6"
                strokeLinecap="round"
            />
            <text
                x="24"
                y="45"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="700"
                letterSpacing=".6"
                fill="rgb(55 53 47 / 0.5)"
            >
                {extension.toUpperCase()}
            </text>
        </svg>
    );
}

function formatDuration(seconds: number) {
    const rounded = Math.round(seconds);
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function VideoThumb({ src, variant }: { src: string; variant: "card" | "mini" }) {
    const [duration, setDuration] = useState<number>();
    return (
        <>
            {/* #t=0.1 makes Safari paint the first frame instead of a black box. */}
            <video
                src={`${src}#t=0.1`}
                preload="metadata"
                muted
                playsInline
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
                className="size-full object-cover"
            />
            {variant === "card" && (
                <>
                    <span className="absolute top-1/2 left-1/2 grid size-9 -translate-1/2 place-items-center rounded-full bg-black/55 text-white">
                        <Play className="ml-0.5 size-4 fill-current" />
                    </span>
                    {duration !== undefined && Number.isFinite(duration) && (
                        <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-[5px] text-[11px] leading-[18px] font-medium text-white tabular-nums">
                            {formatDuration(duration)}
                        </span>
                    )}
                </>
            )}
        </>
    );
}

/**
 * Images and videos load straight from their public URL, which redirects to R2. A plain img on purpose: next/image would
 * send every file through Vercel's image optimizer.
 */
export function FileThumb({ fileKey, variant }: { fileKey: string; variant: "card" | "mini" }) {
    const kind = fileKind(fileKey);
    if (kind === "image") {
        return (
            // oxlint-disable-next-line nextjs/no-img-element -- see above
            <img
                src={`/${fileKey}`}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="size-full object-cover"
            />
        );
    }
    if (kind === "video") return <VideoThumb src={`/${fileKey}`} variant={variant} />;
    return (
        <span className="grid size-full place-items-center">
            <FileTypeIcon name={fileKey} className={variant === "card" ? "h-[68px] w-[58px]" : "h-[18px] w-[15px]"} />
        </span>
    );
}
