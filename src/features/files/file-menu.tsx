"use client";

import { Download, Link, Maximize2, Trash2 } from "lucide-react";
import type { ReactElement } from "react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { copyLink } from "./copy-link";

type Props = {
    fileKey: string;
    onOpen: (key: string) => void;
    onDelete: (key: string) => void;
    children: ReactElement;
};

const item = "h-7 gap-2 rounded px-2 [&_svg:not([class*='text-'])]:text-muted-foreground";

// modal={false} because Delete opens a dialog, and a modal menu closing underneath it leaves the page unclickable.
export function FileMenu({ fileKey, onOpen, onDelete, children }: Props) {
    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px] rounded-lg px-1 py-[5px]">
                <DropdownMenuItem className={item} onSelect={() => void copyLink(fileKey)}>
                    <Link />
                    Copy link
                </DropdownMenuItem>
                <DropdownMenuItem className={item} onSelect={() => onOpen(fileKey)}>
                    <Maximize2 />
                    Open
                </DropdownMenuItem>
                <DropdownMenuItem className={item} asChild>
                    <a href={`/${fileKey}?download`}>
                        <Download />
                        Download
                    </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-[5px]" />
                <DropdownMenuItem className={item} variant="destructive" onSelect={() => onDelete(fileKey)}>
                    <Trash2 />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
