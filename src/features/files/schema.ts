import { z } from "zod";

export const MAX_FILE_SIZE_MB = 500;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Body of PUT /. The error messages are written for the AI agents that call this API: each one states what was wrong
 * and how to produce the right value, because the JSON error response is all the context an agent gets.
 */
export const createUploadSchema = z.object({
    filename: z
        .string({ error: 'filename must be a string, e.g. "login-flow.png".' })
        .min(1, 'filename must not be empty. Pass the original file name, e.g. "login-flow.png".')
        .max(255, "filename must be at most 255 characters. Pass the file name only, not a path."),
    size: z
        .int({ error: "size must be an integer number of bytes. Get it with: wc -c < yourfile" })
        .positive("size must be greater than 0 bytes. Get the exact size with: wc -c < yourfile")
        .max(MAX_FILE_SIZE_BYTES, {
            error: (issue) =>
                `size is ${String(issue.input)} bytes but the limit is ${MAX_FILE_SIZE_BYTES} bytes (${MAX_FILE_SIZE_MB} MB). This file is too large to upload here.`,
        }),
});

export type CreateUpload = z.infer<typeof createUploadSchema>;
