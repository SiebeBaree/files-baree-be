"use client";

import { Calendar, Ellipsis, Hash, Hourglass, Link } from "lucide-react";

import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

import { copyLink } from "./copy-link";
import { formatDay } from "./file-info";
import { Expiry, FileName } from "./file-labels";
import { FileMenu } from "./file-menu";
import { FileThumb } from "./file-thumb";
import { IconButton } from "./icon-button";
import type { StoredFile } from "./list-objects";

type Props = {
    files: StoredFile[];
    /** Undefined until hydrated, see useHydrated. */
    now: number | undefined;
    onOpen: (key: string) => void;
    onDelete: (key: string) => void;
};

// Phones keep the name column and fold size and date under it.
const columns =
    "grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_84px_92px_96px_136px] items-center gap-x-3";

export function FileTable({ files, now, onOpen, onDelete }: Props) {
    return (
        <div>
            <div aria-hidden className={cn(columns, "-mt-3 h-[34px] border-b text-muted-foreground max-sm:hidden")}>
                <span className="flex items-center gap-1.5">
                    <span className="w-3.5 text-[11px] font-medium text-faint">Aa</span>
                    Name
                </span>
                <span className="flex items-center gap-1.5">
                    <Hash className="size-3.5 text-faint" />
                    Size
                </span>
                <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5 text-faint" />
                    Uploaded
                </span>
                <span className="flex items-center gap-1.5">
                    <Hourglass className="size-3.5 text-faint" />
                    Expires
                </span>
                <span />
            </div>
            <ul>
                {files.map((file) => (
                    <li
                        key={file.key}
                        className={cn(
                            columns,
                            "group relative min-h-11 border-b py-1.5 text-muted-foreground tabular-nums hover:bg-foreground/3 has-data-[state=open]:bg-foreground/3",
                        )}
                    >
                        <button
                            type="button"
                            aria-label={`Open ${file.key}`}
                            onClick={() => onOpen(file.key)}
                            className="absolute inset-0 z-10 focus-visible:outline-2 focus-visible:outline-ring"
                        />
                        <span className="flex min-w-0 items-center gap-2.5 font-medium text-foreground">
                            <span className="relative grid h-6 w-9 shrink-0 place-items-center overflow-hidden rounded-[3px] bg-muted after:absolute after:inset-0 after:rounded-[3px] after:shadow-[inset_0_0_0_1px_rgb(55_53_47/0.09)]">
                                <FileThumb fileKey={file.key} variant="mini" />
                            </span>
                            <span className="min-w-0">
                                <FileName name={file.key} />
                                <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                                    {formatBytes(file.size)}
                                    {now !== undefined && ` · ${formatDay(file.uploadedAt, now)}`}
                                </span>
                            </span>
                        </span>
                        <span className="max-sm:hidden">{formatBytes(file.size)}</span>
                        <span className="max-sm:hidden">{now !== undefined && formatDay(file.uploadedAt, now)}</span>
                        <span className="max-sm:hidden">
                            {now !== undefined && <Expiry uploadedAt={file.uploadedAt} now={now} />}
                        </span>
                        <span className="relative z-20 flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-has-data-[state=open]:opacity-100 pointer-coarse:opacity-100">
                            <button
                                type="button"
                                onClick={() => void copyLink(file.key)}
                                className="flex h-7 items-center gap-[5px] rounded-md px-2 font-medium whitespace-nowrap text-primary hover:bg-primary/8 pointer-coarse:hidden"
                            >
                                <Link className="size-[15px]" />
                                Copy link
                            </button>
                            <FileMenu fileKey={file.key} onOpen={onOpen} onDelete={onDelete}>
                                <IconButton label="More actions">
                                    <Ellipsis />
                                </IconButton>
                            </FileMenu>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
