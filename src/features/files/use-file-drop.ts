"use client";

import { useEffect, useEffectEvent, useState } from "react";

/**
 * Calls onFiles for files dropped anywhere on the window or pasted from the clipboard, which is how a screenshot gets
 * in with ⌘V. Returns whether files are being dragged over the window.
 */
export function useFileDrop(onFiles: (files: File[]) => void) {
    const [dragging, setDragging] = useState(false);
    const handleFiles = useEffectEvent(onFiles);

    useEffect(() => {
        // dragenter and dragleave fire for every element crossed, so count them to know when the drag left the window.
        let depth = 0;
        const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;

        function onDragEnter(event: DragEvent) {
            if (!hasFiles(event)) return;
            event.preventDefault();
            depth += 1;
            setDragging(true);
        }
        function onDragOver(event: DragEvent) {
            if (hasFiles(event)) event.preventDefault();
        }
        function onDragLeave(event: DragEvent) {
            if (!hasFiles(event)) return;
            depth = Math.max(0, depth - 1);
            if (depth === 0) setDragging(false);
        }
        function onDrop(event: DragEvent) {
            if (!hasFiles(event)) return;
            event.preventDefault();
            depth = 0;
            setDragging(false);
            handleFiles([...(event.dataTransfer?.files ?? [])]);
        }
        function onPaste(event: ClipboardEvent) {
            const files = [...(event.clipboardData?.files ?? [])];
            // Pasting text, e.g. into the search box, keeps working.
            if (files.length === 0) return;
            event.preventDefault();
            handleFiles(files);
        }

        window.addEventListener("dragenter", onDragEnter);
        window.addEventListener("dragover", onDragOver);
        window.addEventListener("dragleave", onDragLeave);
        window.addEventListener("drop", onDrop);
        window.addEventListener("paste", onPaste);
        return () => {
            window.removeEventListener("dragenter", onDragEnter);
            window.removeEventListener("dragover", onDragOver);
            window.removeEventListener("dragleave", onDragLeave);
            window.removeEventListener("drop", onDrop);
            window.removeEventListener("paste", onPaste);
        };
    }, []);

    return dragging;
}
