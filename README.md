# files.baree.be

A personal file host that lets AI agents attach screenshots and recordings to GitHub PRs.

When a coding agent finishes a UI change, the proof is a screenshot. An agent working from a terminal has no way to attach one to a PR, so the visual context never makes it into review. This service fixes that with two curl commands. The first returns an upload URL, the second uploads the file, and the resulting link can go straight into the PR description.

```bash
# 1. request an upload URL for your file
curl -X PUT https://files.baree.be/ \
  -H "Authorization: Bearer $UPLOAD_TOKEN" \
  -d "{\"filename\": \"login-flow.png\", \"size\": $(wc -c < login-flow.png)}"
# => { "upload_url": "...", "public_url": "https://files.baree.be/30d/login-flow-b6f9ac.png", "expires_at": "..." }

# 2. upload the file to upload_url, then share public_url
curl -T login-flow.png '<upload_url>'
```

For the files you upload yourself there is a drive at the root of the site, styled after Notion. Sign in with the same token, then drop, paste or pick files. It copies the link when an upload lands and previews images, videos, PDFs and text. Every file shows when it expires and files kept forever get a yellow border. It works on a phone too.

## How it works

The app is a Next.js project on Vercel with two route handlers and the drive page. The file itself never touches the app.

`PUT /` authenticates, validates the filename and size and returns a presigned Cloudflare R2 PUT URL. The agent uploads the bytes directly to R2. This keeps uploads under Vercel's 4.5 MB request body cap and keeps the traffic on Cloudflare, where egress is free.

`GET /<key>` redirects to a short-lived presigned R2 GET, so the bucket never needs public access. The redirect also pins the Content-Type from the file extension, because `curl -T` sends none. Add `?download` to get the file as an attachment.

The drive uploads the same way as an agent, from the browser: the server presigns and the browser PUTs the bytes to R2.

Details worth knowing:

- Filenames are slugified with a random hex suffix, so `login-flow.png` becomes `login-flow-b6f9ac.png`.
- Files expire after 30 days. Pass `"retention": "60d"`, `"90d"` or `"forever"` to keep one longer. The retention is the first path segment of the key (`30d/login-flow-b6f9ac.png`) because R2 lifecycle rules can only match a prefix.
- The 500 MB limit is enforced by signing Content-Length into the upload URL. Uploading a different byte count fails with a 403 from R2.
- The bucket is capped at 100 GB. There is no database: each presign lists the bucket and adds up every object, so deleting or expiring a file frees its space. Over the cap, the API answers 507.
- Error responses are written for the AI agents calling the API. Every one states what was wrong and how to fix it, because the JSON body is all the context an agent gets.
- File links need no auth, they live in PRs. Uploading needs the bearer token, compared timing-safe. The drive signs in with the same token and keeps a 30 day signed cookie, with no session store. Rotate the token to sign out every browser.

## Run your own

Deploy to Vercel, create a private R2 bucket and set these environment variables:

| Variable               | What it is                                                  |
| ---------------------- | ----------------------------------------------------------- |
| `APP_URL`              | Public URL of the deployment, e.g. `https://files.baree.be` |
| `R2_ACCOUNT_ID`        | Cloudflare account id                                       |
| `R2_ACCESS_KEY_ID`     | R2 API token key id                                         |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret                                         |
| `R2_BUCKET`            | R2 bucket name                                              |
| `UPLOAD_TOKEN`         | Upload secret, minimum 16 characters                        |

Two settings on the bucket:

- A CORS rule so the drive can upload from the browser:

    ```json
    [{ "AllowedOrigins": ["https://files.baree.be"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["content-type"] }]
    ```

- Three lifecycle rules: delete objects with prefix `30d/` after 30 days, `60d/` after 60 and `90d/` after 90. Leave `forever/` without a rule. The drive shows expiry dates based on them.

Then tell your agent about the endpoint and give it the token. For local development run `pnpm install` and `pnpm dev`.

Plans instead of files? The sibling project [plan.baree.be](https://plan.baree.be) hosts HTML plans the same way.

## License

MIT
