"use client";

import { Check, ChevronDown, Link, X } from "lucide-react";
import { useState } from "react";

import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

import { copyLink } from "./copy-link";
import { FileName } from "./file-labels";
import { FileTypeIcon } from "./file-thumb";
import { IconButton } from "./icon-button";
import type { Upload } from "./use-uploads";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function title(uploads: Upload[]) {
    const count = (status: Upload["status"]) => uploads.filter((upload) => upload.status === status).length;
    if (count("uploading")) return `Uploading ${plural(count("uploading"), "file")}`;
    if (count("failed")) return `${plural(count("failed"), "upload")} failed`;
    return `${plural(uploads.length, "upload")} complete`;
}

function UploadRow({ upload, onDismiss }: { upload: Upload; onDismiss: (id: string) => void }) {
    const percent = Math.round((upload.loaded / Math.max(upload.size, 1)) * 100);
    return (
        <li className="flex min-h-14 items-center gap-2.5 py-1.5 pr-2 pl-3.5">
            <span className="relative grid h-6 w-9 shrink-0 place-items-center overflow-hidden rounded-[3px] bg-muted after:absolute after:inset-0 after:rounded-[3px] after:shadow-[inset_0_0_0_1px_rgb(55_53_47/0.09)]">
                {upload.preview ? (
                    // oxlint-disable-next-line nextjs/no-img-element -- a local object URL, nothing to optimize
                    <img src={upload.preview} alt="" className="size-full object-cover" />
                ) : (
                    <FileTypeIcon name={upload.name} className="h-[18px] w-[15px]" />
                )}
            </span>
            <div className="min-w-0 flex-1">
                <FileName name={upload.key ?? upload.name} className="text-[13px] font-medium" />
                {upload.status === "uploading" && (
                    <>
                        <div className="mt-[5px] mb-[3px] h-[3px] overflow-hidden rounded-full bg-border">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="flex justify-between gap-1 text-xs text-faint tabular-nums">
                            <span>
                                {formatBytes(upload.loaded)} of {formatBytes(upload.size)}
                            </span>
                            <span>{percent}%</span>
                        </div>
                    </>
                )}
                {upload.status === "done" && (
                    <div className="flex items-center gap-1 text-xs text-faint">
                        <Check className="size-3.5 text-success" strokeWidth={2.5} />
                        {formatBytes(upload.size)}
                    </div>
                )}
                {upload.status === "failed" && <p className="text-xs text-destructive">{upload.error}</p>}
            </div>
            {upload.status === "done" && upload.key ? (
                <button
                    type="button"
                    onClick={() => upload.key && void copyLink(upload.key)}
                    className="flex h-7 shrink-0 items-center gap-[5px] rounded-md px-2 font-medium whitespace-nowrap text-primary hover:bg-primary/8"
                >
                    <Link className="size-[15px]" />
                    Copy link
                </button>
            ) : (
                <IconButton
                    label={upload.status === "uploading" ? "Cancel upload" : "Dismiss"}
                    onClick={() => onDismiss(upload.id)}
                >
                    <X />
                </IconButton>
            )}
        </li>
    );
}

type Props = { uploads: Upload[]; onDismiss: (id: string) => void; onClear: () => void };

/** Google Drive's corner tray: progress while files upload, their links once they land. */
export function UploadTray({ uploads, onDismiss, onClear }: Props) {
    const [collapsed, setCollapsed] = useState(false);
    if (uploads.length === 0) return null;
    const uploading = uploads.some((upload) => upload.status === "uploading");

    return (
        <section
            aria-label="Uploads"
            className="fixed right-4 bottom-4 z-40 w-[344px] overflow-hidden rounded-lg bg-popover shadow-md ring-1 ring-foreground/5 max-sm:inset-x-2 max-sm:bottom-2 max-sm:w-auto"
        >
            <header
                className={cn("flex h-11 items-center gap-0.5 pr-2 pl-3.5 font-semibold", !collapsed && "border-b")}
            >
                <h2 className="flex-1" aria-live="polite">
                    {title(uploads)}
                </h2>
                <IconButton label={collapsed ? "Expand" : "Collapse"} onClick={() => setCollapsed(!collapsed)}>
                    <ChevronDown className={cn("transition-transform", collapsed && "rotate-180")} />
                </IconButton>
                {!uploading && (
                    <IconButton label="Close" onClick={onClear}>
                        <X />
                    </IconButton>
                )}
            </header>
            {!collapsed && (
                <ul className="max-h-[50vh] overflow-auto py-1">
                    {uploads.map((upload) => (
                        <UploadRow key={upload.id} upload={upload} onDismiss={onDismiss} />
                    ))}
                </ul>
            )}
        </section>
    );
}
