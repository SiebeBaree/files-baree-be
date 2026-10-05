import { cn } from "@/lib/utils";

/** The serif "SB" from the favicon, used as the app's logo. */
export function Monogram({ className }: { className?: string }) {
    return (
        <span
            aria-hidden
            className={cn(
                "grid shrink-0 place-items-center bg-white font-serif leading-none font-medium tracking-[-0.02em] text-[#1e2638] shadow-[inset_0_0_0_1px_rgb(55_53_47/0.14)]",
                className,
            )}
        >
            SB
        </span>
    );
}
