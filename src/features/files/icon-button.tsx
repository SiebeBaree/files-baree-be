import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Notion's quiet square icon button. The label doubles as tooltip and accessible name. */
export function IconButton({ label, className, ...props }: ComponentProps<"button"> & { label: string }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                "grid size-7 shrink-0 place-items-center rounded-md text-faint transition-colors hover:bg-accent hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-[18px]",
                className,
            )}
            {...props}
        />
    );
}
