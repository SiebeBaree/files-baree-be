import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { parseListObjects } from "./list-objects";

function listResult(contents: string, truncated = "") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
  <Name>files</Name>
  <IsTruncated>${truncated ? "true" : "false"}</IsTruncated>
  ${truncated ? `<NextContinuationToken>${truncated}</NextContinuationToken>` : ""}
  ${contents}
</ListBucketResult>`;
}

const LOGIN = `<Contents><Key>login-flow-b6f9ac.png</Key><LastModified>2026-10-04T09:12:45.120Z</LastModified><ETag>"abc"</ETag><Size>48213</Size><StorageClass>STANDARD</StorageClass></Contents>`;
const DEMO = `<Contents><Key>demo-3e91d0.mp4</Key><LastModified>2026-09-30T23:59:59.000Z</LastModified><Size>1048576</Size></Contents>`;

describe("parseListObjects", () => {
    it("reads key, size and upload time of every object", () => {
        expect(parseListObjects(listResult(LOGIN + DEMO)).files).toEqual([
            { key: "login-flow-b6f9ac.png", size: 48213, uploadedAt: new Date("2026-10-04T09:12:45.120Z") },
            { key: "demo-3e91d0.mp4", size: 1048576, uploadedAt: new Date("2026-09-30T23:59:59.000Z") },
        ]);
    });

    it("handles an empty bucket", () => {
        expect(parseListObjects(listResult(""))).toEqual({ files: [], continuationToken: undefined });
    });

    it("returns the continuation token only when the listing is truncated", () => {
        expect(parseListObjects(listResult(LOGIN, "1/a+b&amp;c=")).continuationToken).toBe("1/a+b&c=");
        expect(parseListObjects(listResult(LOGIN)).continuationToken).toBeUndefined();
    });

    it("throws on an object it cannot read instead of inventing a size", () => {
        expect(() => parseListObjects(listResult("<Contents><Key>a.png</Key></Contents>"))).toThrow(ZodError);
    });
});
