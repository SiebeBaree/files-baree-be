"use client";

import { CircleAlert, Check, LayoutGrid, List, Menu, Search, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";

import { Monogram } from "@/components/monogram";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/lib/utils";

import { DeleteDialog } from "./delete-dialog";
import { FileGrid } from "./file-grid";
import { fileKind, type KindFilter } from "./file-info";
import { KIND_LABELS } from "./file-labels";
import { FilePeek } from "./file-peek";
import { FileTable } from "./file-table";
import { IconButton } from "./icon-button";
import type { StoredFile } from "./list-objects";
import type { MonthlyUsage } from "./quota";
import { MAX_FILE_SIZE_MB } from "./schema";
import { Sidebar } from "./sidebar";
import { UploadTray } from "./upload-tray";
import { useFileDrop } from "./use-file-drop";
import { useUploads } from "./use-uploads";

type Props = {
    files: StoredFile[];
    usage: MonthlyUsage;
    signOut: () => Promise<void>;
};

/** The signed-in app: a Notion-style workspace to upload, browse, preview and delete files. */
export function Drive({ files, usage, signOut }: Props) {
    const [kind, setKind] = useState<KindFilter>("all");
    const [query, setQuery] = useState("");
    const [view, setView] = useState<"gallery" | "list">("gallery");
    const [peekKey, setPeekKey] = useState<string>();
    const [deleteKey, setDeleteKey] = useState<string>();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mountedAt] = useState(Date.now);
    const now = useHydrated() ? mountedAt : undefined;

    const { uploads, uploadFiles, dismiss, clearFinished } = useUploads();
    const dragging = useFileDrop(uploadFiles);
    const searchRef = useRef<HTMLInputElement>(null);
    const pickerRef = useRef<HTMLInputElement>(null);

    const sorted = useMemo(() => files.toSorted((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()), [files]);
    const counts = useMemo(() => {
        const result: Record<KindFilter, number> = { all: sorted.length, image: 0, video: 0, document: 0, other: 0 };
        for (const file of sorted) result[fileKind(file.key)] += 1;
        return result;
    }, [sorted]);
    const shown = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return sorted.filter((file) => (kind === "all" || fileKind(file.key) === kind) && file.key.includes(needle));
    }, [sorted, kind, query]);
    const peekFile = sorted.find((file) => file.key === peekKey);

    function focusSearch() {
        setSidebarOpen(false);
        searchRef.current?.focus();
    }

    function pickFiles() {
        setSidebarOpen(false);
        pickerRef.current?.click();
    }

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
            const key = event.key.toLowerCase();
            if (key !== "k" && key !== "u") return;
            event.preventDefault();
            if (key === "k") searchRef.current?.focus();
            else pickerRef.current?.click();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const sidebar = {
        kind,
        counts,
        usage,
        signOut,
        onSearch: focusSearch,
        onUpload: pickFiles,
        onKind: (filter: KindFilter) => {
            setKind(filter);
            setSidebarOpen(false);
        },
    };

    return (
        <div className="flex h-dvh">
            <aside className="hidden w-60 shrink-0 bg-sidebar shadow-[inset_-1px_0_0_rgb(55_53_47/0.06)] md:block">
                <Sidebar {...sidebar} />
            </aside>
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent
                    side="left"
                    showCloseButton={false}
                    aria-describedby={undefined}
                    className="gap-0 bg-sidebar p-0 data-[side=left]:w-[280px] md:hidden"
                >
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <Sidebar {...sidebar} onClose={() => setSidebarOpen(false)} />
                </SheetContent>
            </Sheet>

            <main className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-[45px] shrink-0 items-center gap-2 px-3">
                    <IconButton label="Open sidebar" onClick={() => setSidebarOpen(true)} className="md:hidden">
                        <Menu />
                    </IconButton>
                    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-0.5">
                        <button
                            type="button"
                            onClick={() => setKind("all")}
                            className="flex h-6 items-center gap-1.5 rounded px-1.5 whitespace-nowrap text-muted-foreground hover:bg-accent max-sm:hidden"
                        >
                            <Monogram className="size-[18px] rounded text-[8.5px]" />
                            files.baree.be
                        </button>
                        <span className="text-faint max-sm:hidden">/</span>
                        <span className="truncate px-1.5">{KIND_LABELS[kind]}</span>
                    </nav>
                    <div className="ml-auto flex gap-0.5">
                        {(["gallery", "list"] as const).map((option) => {
                            const Icon = option === "gallery" ? LayoutGrid : List;
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    aria-pressed={view === option}
                                    aria-label={option === "gallery" ? "Gallery" : "List"}
                                    onClick={() => setView(option)}
                                    className={cn(
                                        "flex h-7 items-center gap-1.5 rounded-md px-2 text-muted-foreground transition-colors hover:bg-accent",
                                        view === option && "bg-secondary text-foreground hover:bg-secondary",
                                    )}
                                >
                                    <Icon className="size-4" />
                                    <span className="max-sm:hidden">{option === "gallery" ? "Gallery" : "List"}</span>
                                </button>
                            );
                        })}
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-auto">
                    <div className="px-4 pt-5 pb-44 sm:px-12 sm:pt-[30px]">
                        <h1 className="mb-3.5 text-[28px] leading-tight font-bold sm:text-[32px]">
                            {KIND_LABELS[kind]}
                        </h1>
                        <div className="mb-5 flex h-[42px] items-center gap-3 border-b">
                            <label className="-ml-1.5 flex h-7 w-[260px] min-w-0 cursor-text items-center gap-1.5 rounded-md px-1.5 text-faint focus-within:bg-accent hover:bg-accent max-sm:flex-1">
                                <Search className="size-4 shrink-0" />
                                <input
                                    ref={searchRef}
                                    type="search"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    onKeyDown={(event) => event.key === "Escape" && event.currentTarget.blur()}
                                    placeholder="Search files"
                                    aria-label="Search files"
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
                                />
                            </label>
                            <div className="ml-auto flex items-center gap-3">
                                <span className="text-xs whitespace-nowrap text-faint max-lg:hidden pointer-coarse:hidden">
                                    Drop files or paste with <kbd className="font-sans">⌘V</kbd>
                                </span>
                                <button
                                    type="button"
                                    onClick={pickFiles}
                                    className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary-hover"
                                >
                                    <Upload className="size-4" />
                                    Upload
                                </button>
                            </div>
                        </div>

                        {shown.length > 0 ? (
                            view === "gallery" ? (
                                <FileGrid files={shown} now={now} onOpen={setPeekKey} onDelete={setDeleteKey} />
                            ) : (
                                <FileTable files={shown} now={now} onOpen={setPeekKey} onDelete={setDeleteKey} />
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-2 py-[72px] text-center text-muted-foreground">
                                {query.trim() ? (
                                    <>
                                        No files match &ldquo;{query.trim()}&rdquo;
                                        <button
                                            type="button"
                                            onClick={() => setQuery("")}
                                            className="h-7 rounded-md px-2 font-medium text-primary hover:bg-primary/8"
                                        >
                                            Clear search
                                        </button>
                                    </>
                                ) : files.length === 0 ? (
                                    "Drop a file anywhere or paste a screenshot to upload it."
                                ) : (
                                    `No ${KIND_LABELS[kind].toLowerCase()} yet.`
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <UploadTray uploads={uploads} onDismiss={dismiss} onClear={clearFinished} />

            {dragging && (
                <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-white/90">
                    <div className="absolute inset-2.5 rounded-[10px] border-2 border-dashed border-primary/55 bg-primary/4" />
                    <div className="relative text-center">
                        <Upload className="mx-auto mb-2.5 size-[34px] text-primary" strokeWidth={1.5} />
                        <p className="text-lg font-semibold">Drop to upload</p>
                        <p className="mt-0.5 text-muted-foreground">Up to {MAX_FILE_SIZE_MB} MB per file</p>
                    </div>
                </div>
            )}

            {now !== undefined && (
                <FilePeek
                    file={peekFile}
                    files={shown}
                    now={now}
                    onOpen={setPeekKey}
                    onClose={() => setPeekKey(undefined)}
                    onDelete={setDeleteKey}
                />
            )}
            <DeleteDialog fileKey={deleteKey} onClose={() => setDeleteKey(undefined)} />

            <input
                ref={pickerRef}
                type="file"
                multiple
                hidden
                onChange={(event) => {
                    uploadFiles([...(event.currentTarget.files ?? [])]);
                    event.currentTarget.value = "";
                }}
            />
            <Toaster
                position="bottom-center"
                duration={1800}
                icons={{
                    success: <Check className="size-4" strokeWidth={2.5} />,
                    error: <CircleAlert className="size-4" />,
                }}
                toastOptions={{
                    unstyled: true,
                    classNames: {
                        toast: "inset-x-0 mx-auto flex w-fit! max-w-[min(480px,calc(100vw-32px))] items-center gap-2 rounded-md bg-[rgb(15_15_15/0.88)] py-2 pr-3.5 pl-3 text-sm text-white shadow-[0_6px_16px_rgb(15_15_15/0.2)]",
                    },
                }}
            />
        </div>
    );
}
