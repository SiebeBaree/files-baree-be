# files.baree.be

A personal file host that lets AI agents attach screenshots and recordings to GitHub PRs.

When a coding agent finishes a UI change, the proof is a screenshot. An agent working from a terminal has no way to attach one to a PR, so the visual context never makes it into review. This service fixes that with two curl commands. The first returns an upload URL, the second uploads the file, and the resulting link can go straight into the PR description.

```bash
# 1. request an upload URL for your file
curl -X PUT https://files.baree.be/ \
  -H "Authorization: Bearer $UPLOAD_TOKEN" \
  -d "{\"filename\": \"login-flow.png\", \"size\": $(wc -c < login-flow.png)}"
# => { "upload_url": "...", "public_url": "https://files.baree.be/login-flow-b6f9ac.png" }

# 2. upload the file to upload_url, then share public_url
curl -T login-flow.png '<upload_url>'
```

## How it works

The app is a Next.js project on Vercel with two route handlers and a landing page. The file itself never touches the app.

`PUT /` authenticates, validates the filename and size and returns a presigned Cloudflare R2 PUT URL. The agent uploads the bytes directly to R2. This keeps uploads under Vercel's 4.5 MB request body cap and keeps the traffic on Cloudflare, where egress is free.

`GET /<key>` redirects to a short-lived presigned R2 GET, so the bucket never needs public access. The redirect also pins the Content-Type from the file extension, because `curl -T` sends none.

Details worth knowing:

- Filenames are slugified with a random hex suffix, so `login-flow.png` becomes `login-flow-b6f9ac.png`.
- The 200 MB limit is enforced by signing Content-Length into the upload URL. Uploading a different byte count fails with a 403 from R2.
- Error responses are written for the AI agents calling the API. Every one states what was wrong and how to fix it, because the JSON body is all the context an agent gets.
- Downloads need no auth. Uploading is protected by a bearer token, compared timing-safe.

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

Then tell your agent about the endpoint and give it the token. For local development run `pnpm install` and `pnpm dev`.

Plans instead of files? The sibling project [plan.baree.be](https://plan.baree.be) hosts HTML plans the same way.

## License

MIT
