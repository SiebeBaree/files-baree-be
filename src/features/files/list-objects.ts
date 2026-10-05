import { z } from "zod";

const storedFileSchema = z.object({
    key: z.string().min(1),
    size: z.coerce.number().int().nonnegative(),
    uploadedAt: z.coerce.date(),
});

export type StoredFile = z.infer<typeof storedFileSchema>;

const XML_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function tagText(xml: string, tag: string) {
    return xml
        .match(new RegExp(`<${tag}>([^<]*)</${tag}>`))?.[1]
        ?.replaceAll(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => XML_ENTITIES[name] ?? "");
}

/**
 * Parses one page of an S3 ListObjectsV2 response. The XML is flat and machine generated, so matching the four tags we
 * need is enough. Anything unexpected throws instead of turning into a file with a bogus size.
 */
export function parseListObjects(xml: string) {
    const files = Array.from(xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g), ([, entry = ""]) =>
        storedFileSchema.parse({
            key: tagText(entry, "Key"),
            size: tagText(entry, "Size"),
            uploadedAt: tagText(entry, "LastModified"),
        }),
    );
    const continuationToken =
        tagText(xml, "IsTruncated") === "true" ? tagText(xml, "NextContinuationToken") : undefined;
    return { files, continuationToken };
}
