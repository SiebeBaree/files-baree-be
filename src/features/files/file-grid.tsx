"use client";

import { Ellipsis, Link } from "lucide-react";

import { formatBytes } from "@/lib/format";

import { copyLink } from "./copy-link";
import { formatDay } from "./file-info";
import { Expiry, FileName } from "./file-labels";
import { FileMenu } from "./file-menu";
import { FileThumb } from "./file-thumb";
import type { StoredFile } from "./list-objects";

type Props = {
    files: StoredFile[];
    /** Undefined until hydrated, see useHydrated. */
    now: number | undefined;
    onOpen: (key: string) => void;
    onDelete: (key: string) => void;
};

const chip =
    "flex h-6 items-center gap-1 rounded-[5px] bg-white px-1.5 text-xs font-medium whitespace-nowrap shadow-[0_0_0_1px_rgb(15_15_15/0.1),0_2px_4px_rgb(15_15_15/0.1)] hover:bg-[rgb(239_239_238)]";

// Hover reveals the actions. Touch screens have no hover, so there the menu button always shows and holds Copy link.
const actions =
    "absolute top-1.5 right-1.5 z-20 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 group-has-data-[state=open]:opacity-100 pointer-coarse:opacity-100";

export function FileGrid({ files, now, onOpen, onDelete }: Props) {
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-3 gap-y-5 sm:grid-cols-[repeat(auto-fill,minmax(188px,1fr))] sm:gap-x-5 sm:gap-y-[26px]">
            {files.map((file) => (
                <li key={file.key} className="group relative min-w-0">
                    <button
                        type="button"
                        aria-label={`Open ${file.key}`}
                        onClick={() => onOpen(file.key)}
                        className="absolute inset-0 z-10 rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                    />
                    <div className="relative aspect-16/10 overflow-hidden rounded-md bg-muted after:absolute after:inset-0 after:rounded-md after:shadow-[inset_0_0_0_1px_rgb(55_53_47/0.09)] after:transition-colors group-hover:after:bg-foreground/5">
                        <FileThumb fileKey={file.key} variant="card" />
                    </div>
                    <div className={actions}>
                        <button
                            type="button"
                            onClick={() => void copyLink(file.key)}
                            className={`${chip} pointer-coarse:hidden`}
                        >
                            <Link className="size-3.5 text-muted-foreground" />
                            Copy link
                        </button>
                        <FileMenu fileKey={file.key} onOpen={onOpen} onDelete={onDelete}>
                            <button
                                type="button"
                                aria-label="More actions"
                                className={`${chip} w-6 justify-center px-0`}
                            >
                                <Ellipsis className="size-4" />
                            </button>
                        </FileMenu>
                    </div>
                    <FileName name={file.key} className="mt-2 font-medium" />
                    <div className="flex justify-between gap-2 text-xs whitespace-nowrap text-muted-foreground">
                        <span className="truncate">
                            {formatBytes(file.size)}
                            {now !== undefined && ` · ${formatDay(file.uploadedAt, now)}`}
                        </span>
                        {now !== undefined && <Expiry uploadedAt={file.uploadedAt} now={now} />}
                    </div>
                </li>
            ))}
        </ul>
    );
}
