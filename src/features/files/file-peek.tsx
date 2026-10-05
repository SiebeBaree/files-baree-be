"use client";

import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Download,
    ExternalLink,
    Hash,
    Hourglass,
    Link,
    type LucideIcon,
    Trash2,
    X,
} from "lucide-react";
import { type KeyboardEvent, type ReactNode, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

import { copyLink } from "./copy-link";
import { daysLeft, expiresAt, type FileKind, fileKind, formatDay } from "./file-info";
import { KIND_ICONS } from "./file-labels";
import { FilePreview } from "./file-preview";
import { IconButton } from "./icon-button";
import type { StoredFile } from "./list-objects";
import { contentTypeFor } from "./object-key";

const KIND_NOUNS: Record<FileKind, string> = { image: "image", video: "video", document: "document", other: "file" };

type Props = {
    file: StoredFile | undefined;
    /** The list the peek steps through with the arrows: the files currently shown. */
    files: StoredFile[];
    now: number;
    onOpen: (key: string) => void;
    onClose: () => void;
    onDelete: (key: string) => void;
};

function Property({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
    return (
        <div className="flex items-start py-[5px]">
            <dt className="flex h-[22px] w-[108px] shrink-0 items-center gap-1.5 text-muted-foreground">
                <Icon className="size-4 text-faint" />
                {label}
            </dt>
            <dd className="min-w-0 flex-1 leading-[22px] [overflow-wrap:anywhere]">{children}</dd>
        </div>
    );
}

/** Notion's center peek: the file large on the left, its properties and actions on the right. Full screen on phones. */
export function FilePeek({ file, files, now, onOpen, onClose, onDelete }: Props) {
    // Keep rendering the last file while the dialog animates out.
    const [shown, setShown] = useState(file);
    if (file && file !== shown) setShown(file);

    const index = shown ? files.findIndex((candidate) => candidate.key === shown.key) : -1;
    const previous = index > 0 ? files[index - 1] : undefined;
    const next = index !== -1 ? files[index + 1] : undefined;

    function onKeyDown(event: KeyboardEvent) {
        if (!shown || event.target instanceof HTMLMediaElement || event.target instanceof HTMLInputElement) return;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
            if (previous) onOpen(previous.key);
        } else if (event.key === "ArrowDown" || event.key === "ArrowRight") {
            if (next) onOpen(next.key);
        } else if (event.key === "c" && (event.metaKey || event.ctrlKey) && !window.getSelection()?.toString()) {
            void copyLink(shown.key);
        } else if (event.key === "Backspace" || event.key === "Delete") {
            onDelete(shown.key);
        } else {
            return;
        }
        event.preventDefault();
    }

    const kind = shown ? fileKind(shown.key) : "other";
    const extension = shown?.key.includes(".") ? shown.key.slice(shown.key.lastIndexOf(".") + 1).toUpperCase() : "";
    const days = shown ? daysLeft(shown.uploadedAt, now) : 0;

    return (
        <Dialog open={file !== undefined} onOpenChange={(open) => !open && onClose()}>
            <DialogContent
                showCloseButton={false}
                aria-describedby={undefined}
                onKeyDown={onKeyDown}
                className="flex h-dvh w-full max-w-none flex-col gap-0 rounded-none p-0 shadow-md ring-0 sm:h-[calc(100dvh-80px)] sm:w-[min(1040px,calc(100%-96px))] sm:max-w-none sm:rounded-[10px]"
            >
                {shown && (
                    <>
                        <div className="flex h-11 shrink-0 items-center gap-0.5 px-2">
                            <IconButton label="Close" onClick={onClose}>
                                <X />
                            </IconButton>
                            <span className="mx-1 h-4 w-px bg-border" />
                            <IconButton
                                label="Previous"
                                disabled={!previous}
                                onClick={() => previous && onOpen(previous.key)}
                            >
                                <ChevronUp />
                            </IconButton>
                            <IconButton label="Next" disabled={!next} onClick={() => next && onOpen(next.key)}>
                                <ChevronDown />
                            </IconButton>
                            <a
                                href={`/${shown.key}`}
                                target="_blank"
                                rel="noopener"
                                aria-label="Open original"
                                title="Open original"
                                className="ml-auto grid size-7 place-items-center rounded-md text-faint hover:bg-accent hover:text-muted-foreground"
                            >
                                <ExternalLink className="size-[18px]" />
                            </a>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-auto md:grid md:grid-cols-[minmax(0,1fr)_320px] md:overflow-hidden">
                            <div
                                className={cn(
                                    "mx-3 mb-3 flex min-h-[45vh] shrink-0 items-center justify-center overflow-auto rounded-md bg-muted p-4 md:mr-0 md:min-h-0 md:p-8",
                                    contentTypeFor(shown.key) === "application/pdf" && "p-0 md:p-0",
                                )}
                            >
                                <FilePreview file={shown} />
                            </div>
                            <div className="min-w-0 px-4 pb-6 md:overflow-auto md:px-6 md:pt-1">
                                <DialogTitle className="mt-1.5 mb-4 text-2xl leading-tight font-bold [overflow-wrap:anywhere]">
                                    {shown.key}
                                </DialogTitle>
                                <dl>
                                    <Property icon={KIND_ICONS[kind]} label="Type">
                                        {extension ? `${extension} ${KIND_NOUNS[kind]}` : "File"}
                                    </Property>
                                    <Property icon={Hash} label="Size">
                                        {formatBytes(shown.size)}
                                    </Property>
                                    <Property icon={Calendar} label="Uploaded">
                                        {shown.uploadedAt.toLocaleString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                    </Property>
                                    <Property icon={Hourglass} label="Expires">
                                        {formatDay(expiresAt(shown.uploadedAt), now)}{" "}
                                        <span className={days <= 10 ? "text-warning" : "text-faint"}>
                                            {days === 0 ? "today" : `in ${days} ${days === 1 ? "day" : "days"}`}
                                        </span>
                                    </Property>
                                    <Property icon={Link} label="Link">
                                        <button
                                            type="button"
                                            onClick={() => void copyLink(shown.key)}
                                            className="text-left underline decoration-foreground/25 underline-offset-[3px] hover:decoration-muted-foreground"
                                        >
                                            {location.host}/{shown.key}
                                        </button>
                                    </Property>
                                </dl>
                                <div className="mt-[18px] flex flex-col gap-0.5 border-t pt-[18px]">
                                    <button
                                        type="button"
                                        onClick={() => void copyLink(shown.key)}
                                        className="mb-2 flex h-[34px] items-center justify-center gap-1.5 rounded-md bg-primary font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                                    >
                                        <Link className="size-4" />
                                        Copy link
                                        <kbd className="ml-0.5 font-sans text-xs opacity-70 pointer-coarse:hidden">
                                            ⌘C
                                        </kbd>
                                    </button>
                                    <a
                                        href={`/${shown.key}?download`}
                                        className="-mx-2 flex h-8 items-center gap-2 rounded-md px-2 hover:bg-accent"
                                    >
                                        <Download className="size-4 text-muted-foreground" />
                                        Download
                                    </a>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(shown.key)}
                                        className="-mx-2 flex h-8 items-center gap-2 rounded-md px-2 text-destructive hover:bg-accent"
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
