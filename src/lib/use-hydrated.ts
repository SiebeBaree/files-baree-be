import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and during hydration, true after. Anything that reads the browser's clock or time zone renders
 * behind it, because the server renders in UTC and a mismatch would fail hydration.
 */
export function useHydrated() {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}
