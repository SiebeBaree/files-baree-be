import { FileText, Hourglass, Image, Layers, type LucideIcon, Package, SquarePlay } from "lucide-react";

import { cn } from "@/lib/utils";

import { daysLeft, expiresAt, formatDay, type KindFilter } from "./file-info";

export const KIND_LABELS: Record<KindFilter, string> = {
    all: "All files",
    image: "Images",
    video: "Videos",
    document: "Documents",
    other: "Other",
};

export const KIND_ICONS: Record<KindFilter, LucideIcon> = {
    all: Layers,
    image: Image,
    video: SquarePlay,
    document: FileText,
    other: Package,
};

/** Truncates the name but keeps the extension visible. */
export function FileName({ name, className }: { name: string; className?: string }) {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : "";
    return (
        <span className={cn("flex min-w-0 whitespace-nowrap", className)} title={name}>
            <span className="truncate">{base}</span>
            <span className="shrink-0">{extension}</span>
        </span>
    );
}

/** Days until the lifecycle rule deletes the file, orange for the last ten. */
export function Expiry({ uploadedAt, now }: { uploadedAt: Date; now: number }) {
    const days = daysLeft(uploadedAt, now);
    return (
        <span
            title={`Expires ${formatDay(expiresAt(uploadedAt), now)}`}
            className={cn("flex items-center gap-[3px]", days <= 10 ? "text-warning" : "text-faint")}
        >
            <Hourglass className="size-3" />
            {days === 0 ? "today" : `${days} ${days === 1 ? "day" : "days"}`}
        </span>
    );
}
