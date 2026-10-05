"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteFile } from "./actions";

/** Confirms before deleting, because a deleted file breaks every PR that links it. */
export function DeleteDialog({ fileKey, onClose }: { fileKey: string | undefined; onClose: () => void }) {
    const [pending, startTransition] = useTransition();
    // Keep the name on screen while the dialog animates out.
    const [shown, setShown] = useState(fileKey);
    if (fileKey && fileKey !== shown) setShown(fileKey);

    function confirm() {
        if (!fileKey) return;
        startTransition(async () => {
            const result = await deleteFile(fileKey).catch(() => ({ error: "Could not delete the file. Try again." }));
            if (result?.error) toast.error(result.error);
            else toast.success(`Deleted ${fileKey}`);
            onClose();
        });
    }

    return (
        <AlertDialog open={fileKey !== undefined} onOpenChange={(open) => !open && !pending && onClose()}>
            <AlertDialogContent className="w-[300px] gap-0 rounded-[10px] px-5 pt-[22px] pb-4 text-center shadow-md ring-0">
                <AlertDialogTitle className="text-[15px] leading-snug font-semibold [overflow-wrap:anywhere]">
                    Delete {shown}?
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1.5 mb-[18px] text-muted-foreground">
                    The link stops working in every PR that uses it.
                </AlertDialogDescription>
                <button
                    type="button"
                    disabled={pending}
                    onClick={confirm}
                    className="h-8 w-full rounded-md bg-destructive font-medium text-white transition-colors hover:bg-[rgb(201_49_49)] disabled:opacity-60"
                >
                    {pending ? "Deleting" : "Delete"}
                </button>
                <AlertDialogCancel
                    disabled={pending}
                    className="mt-2 h-8 w-full rounded-md border-0 bg-transparent font-medium shadow-[inset_0_0_0_1px_rgb(55_53_47/0.16)] hover:bg-accent"
                >
                    Cancel
                </AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    );
}
