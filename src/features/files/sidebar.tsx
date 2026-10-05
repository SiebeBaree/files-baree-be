"use client";

import { ChevronsLeft, Copy, LogOut, type LucideIcon, Search, SquareTerminal, Upload } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { Monogram } from "@/components/monogram";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

import { copyText } from "./copy-link";
import { FILE_KINDS, type KindFilter } from "./file-info";
import { KIND_ICONS, KIND_LABELS } from "./file-labels";
import { IconButton } from "./icon-button";
import type { MonthlyUsage } from "./quota";
import { MAX_FILE_SIZE_MB } from "./schema";

function Row({
    icon: Icon,
    label,
    hint,
    active,
    className,
    ...props
}: ComponentProps<"button"> & { icon: LucideIcon; label: string; hint?: ReactNode; active?: boolean }) {
    return (
        <button
            type="button"
            aria-current={active ? "page" : undefined}
            className={cn(
                "mx-2 my-px flex h-[30px] w-[calc(100%-16px)] items-center gap-2 rounded-md px-2 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent data-[state=open]:bg-secondary",
                active && "bg-secondary text-foreground hover:bg-secondary",
                className,
            )}
            {...props}
        >
            <Icon className={cn("size-[18px] shrink-0", active ? "text-muted-foreground" : "text-faint")} />
            <span className="truncate">{label}</span>
            {hint !== undefined && <span className="ml-auto text-xs font-normal text-faint tabular-nums">{hint}</span>}
        </button>
    );
}

function UsageMeter({ usage }: { usage: MonthlyUsage }) {
    const ratio = Math.min(usage.used / usage.limit, 1);
    // resetsAt is midnight UTC on the 1st, so format in UTC or it reads as the last day of the month in the Americas.
    const reset = usage.resetsAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
    return (
        <div className="mx-4 mb-3 text-xs text-muted-foreground">
            <p>
                <span className="font-medium text-foreground">{formatBytes(usage.used)}</span> of{" "}
                {formatBytes(usage.limit)} used this month
            </p>
            <div className="my-[7px] h-1 overflow-hidden rounded-full bg-border">
                <div
                    className={cn("h-full rounded-full", ratio >= 0.9 ? "bg-warning" : "bg-primary")}
                    style={{ width: `${ratio * 100}%` }}
                />
            </div>
            <p className="text-faint">
                Resets {reset} · {MAX_FILE_SIZE_MB} MB max per file
            </p>
        </div>
    );
}

function CodeBlock({ code, children }: { code: string; children: ReactNode }) {
    return (
        <div className="relative rounded bg-[rgb(247_246_243)]">
            <pre className="overflow-x-auto py-3 pr-10 pl-3.5 font-mono text-[12.5px] leading-[1.65]">{children}</pre>
            <IconButton
                label="Copy command"
                onClick={() => void copyText(code)}
                className="absolute top-1.5 right-1.5 size-[26px] [&_svg]:size-4"
            >
                <Copy />
            </IconButton>
        </div>
    );
}

function TerminalPopover({ side }: { side: "right" | "top" }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Row icon={SquareTerminal} label="Use from terminal" />
            </PopoverTrigger>
            <PopoverContent
                side={side}
                align="end"
                sideOffset={8}
                collisionPadding={8}
                className="w-[520px] max-w-[calc(100vw-16px)] gap-0 rounded-lg px-4 pt-3 pb-4 shadow-md ring-foreground/5"
            >
                <TerminalHelp />
            </PopoverContent>
        </Popover>
    );
}

// Only rendered inside the open popover, so reading location is safe.
function TerminalHelp() {
    const auth = '"Authorization: Bearer $UPLOAD_TOKEN"';
    const body = '"{\\"filename\\": \\"login-flow.png\\", \\"size\\": $(wc -c < login-flow.png)}"';
    const upload = "'<upload_url>'";
    const fn = "text-[#dd4a68]";
    const str = "text-[#690]";
    return (
        <>
            <p className="font-semibold">Use from terminal</p>
            <p className="mt-2.5 mb-1.5 font-medium">
                <span className="text-faint">1.</span> Request an upload URL
            </p>
            <CodeBlock code={`curl -X PUT ${location.origin}/ \\\n  -H ${auth} \\\n  -d ${body}`}>
                <span className={fn}>curl</span>
                {` -X PUT ${location.origin}/ \\\n  -H `}
                <span className={str}>{auth}</span>
                {" \\\n  -d "}
                <span className={str}>{body}</span>
            </CodeBlock>
            <p className="mt-1.5 text-xs text-muted-foreground">
                Returns <code className="font-mono">upload_url</code> and <code className="font-mono">public_url</code>.
            </p>
            <p className="mt-2.5 mb-1.5 font-medium">
                <span className="text-faint">2.</span> Upload the file
            </p>
            <CodeBlock code={`curl -T login-flow.png ${upload}`}>
                <span className={fn}>curl</span> -T login-flow.png <span className={str}>{upload}</span>
            </CodeBlock>
        </>
    );
}

type Props = {
    kind: KindFilter;
    counts: Record<KindFilter, number>;
    usage: MonthlyUsage;
    onKind: (kind: KindFilter) => void;
    onSearch: () => void;
    onUpload: () => void;
    signOut: () => Promise<void>;
    /** Set when the sidebar is the drawer on phones. */
    onClose?: () => void;
};

export function Sidebar({ kind, counts, usage, onKind, onSearch, onUpload, signOut, onClose }: Props) {
    return (
        <div className="flex h-full flex-col pt-1.5 pb-2.5">
            <div className="mx-2 mt-0.5 mb-1.5 flex h-9 items-center gap-2 px-1.5 font-medium">
                <Monogram className="size-[22px] rounded-[5px] text-[10.5px]" />
                <span className="truncate">files.baree.be</span>
                {onClose && (
                    <IconButton label="Close sidebar" onClick={onClose} className="ml-auto size-6">
                        <ChevronsLeft />
                    </IconButton>
                )}
            </div>
            <Row
                icon={Search}
                label="Search"
                hint={<kbd className="font-sans pointer-coarse:hidden">⌘K</kbd>}
                onClick={onSearch}
            />
            <Row
                icon={Upload}
                label="Upload"
                hint={<kbd className="font-sans pointer-coarse:hidden">⌘U</kbd>}
                onClick={onUpload}
            />
            <div className="h-3.5 shrink-0" />
            {(["all", ...FILE_KINDS] as const).map((filter) => (
                <Row
                    key={filter}
                    icon={KIND_ICONS[filter]}
                    label={KIND_LABELS[filter]}
                    hint={counts[filter]}
                    active={kind === filter}
                    onClick={() => onKind(filter)}
                />
            ))}
            <div className="mt-auto">
                <UsageMeter usage={usage} />
                <TerminalPopover side={onClose ? "top" : "right"} />
                <form action={signOut}>
                    <Row type="submit" icon={LogOut} label="Sign out" />
                </form>
            </div>
        </div>
    );
}
