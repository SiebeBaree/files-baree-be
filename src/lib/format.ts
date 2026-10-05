const UNITS = ["B", "KB", "MB", "GB", "TB"];

/**
 * 1024-based to match how the limits are defined: 500 MB is 500 * 1024 * 1024 bytes. MB and up keep one decimal below
 * 100, so a quota reads "12.4 GB" while a screenshot reads "47 KB".
 */
export function formatBytes(bytes: number) {
    const exponent = Math.min(Math.floor(Math.log2(Math.max(bytes, 1)) / 10), UNITS.length - 1);
    const value = bytes / 1024 ** exponent;
    const rounded = exponent >= 2 && value < 100 ? Math.round(value * 10) / 10 : Math.round(value);
    return `${rounded} ${UNITS[exponent]}`;
}
