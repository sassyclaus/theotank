# Object Storage Layout

Infrastructure: S3-compatible storage (Cloudflare R2 in production, MinIO locally). Two buckets.

**Private bucket:** `theotank` (configurable via `S3_BUCKET`) — results JSON, review files, extracted text
**Public bucket:** `theotank-public` (configurable via `S3_PUBLIC_BUCKET`) — theologian portraits, share/OG images

## Key Map

```
theotank/                                                           # Private bucket
├── review-files/{userId}/{fileId}/
│   ├── {fileName}                                                  # Original upload
│   └── extracted/
│       └── text.txt                                                # Extracted text
└── results/{toolType}/{YYYY}/{MM}/{resultId}.json                  # Result content

theotank-public/                                                    # Public bucket
├── portraits/{slug}.{ext}                                          # Theologian headshots
└── share/{resultId}.png                                            # Share/OG images
```

## Prefixes

### `portraits/` (public bucket)

Theologian headshot images. Flat namespace keyed by slug. Stored in the public bucket.

| Attribute | Value |
|-----------|-------|
| Key | `portraits/{slug}.(webp\|png\|jpg)` |
| Bucket | `theotank-public` |
| Access | Public (served via `publicAssetUrl()`) |
| Writer | Admin — browser uploads directly via presigned PUT URL |
| Reader | Frontend `<img>` tags |
| DB column | `theologians.imageKey` |
| Defined in | `packages/api/src/routes/admin/theologians.ts` |

### `review-files/`

User-uploaded source material for the Review tool, plus worker-derived artifacts. Scoped by `{userId}/{fileId}/` so each file's artifacts are collocated.

#### Original upload

| Attribute | Value |
|-----------|-------|
| Key | `review-files/{userId}/{fileId}/{fileName}` |
| Access | Private, user-scoped |
| Writer | Frontend — browser uploads via presigned PUT URL (300s expiry) |
| Reader | Worker (downloads buffer for text extraction) |
| DB column | `reviewFiles.fileKey` |
| Defined in | `packages/api/src/routes/review-files.ts` |
| Content types | `application/pdf`, `text/plain`, `text/html`, `audio/*`, `video/*` |

#### Extracted text

| Attribute | Value |
|-----------|-------|
| Key | `review-files/{userId}/{fileId}/extracted/text.txt` |
| Access | Private, internal |
| Writer | Worker (after text extraction / transcription) |
| Reader | Worker (review processor reads via `textStorageKey`) |
| DB column | `reviewFiles.textStorageKey` |
| Defined in | `packages/worker/src/processors/review-file.ts` |

The `extracted/` subdirectory prevents filename collisions (e.g., a user uploading a file named `text.txt`) and provides a namespace for future derived artifacts.

### `results/`

JSON output from completed tool runs. Partitioned by tool type and date.

| Attribute | Value |
|-----------|-------|
| Key | `results/{toolType}/{YYYY}/{MM}/{resultId}.json` |
| Tool types | `ask`, `poll`, `review`, `research` |
| Access | Private, authenticated API proxy |
| Writer | Worker (via `uploadJson()`) |
| Reader | API `GET /api/results/:id/content` |
| DB column | `results.contentKey` |

Date partitioning prevents flat-listing thousands of objects. The UUID result ID ensures good key distribution within each partition.

#### Content schemas by tool

| Tool | Key fields |
|------|-----------|
| **Ask** | `question`, `perspectives[]`, `synthesis` (comparison, agreements, disagreements) |
| **Poll** | `question`, `optionLabels[]`, `summary`, `theologianSelections[]` |
| **Review** | `reviewFileLabel`, `focusPrompt`, `overallGrade`, `summary`, `grades[]` |
| **Research** | `question`, `theologianName`, `responseText`, `citations[]`, `metadata` |

## S3 Utilities

Two S3 client modules, one per package:

**API** (`packages/api/src/lib/s3.ts`):
- `presignPutUrl(key, contentType)` — 300-second PUT URL for private bucket uploads
- `presignPublicPutUrl(key, contentType)` — 300-second PUT URL for public bucket uploads
- `deleteObject(key)` — remove an object from the private bucket
- `getObject(key)` — download as UTF-8 string from the private bucket
- `publicAssetUrl(key)` — `{S3_PUBLIC_ASSET_URL}/{key}`

**Worker** (`packages/worker/src/s3.ts`):
- `uploadJson(key, data)` — serialize and upload JSON
- `uploadText(key, text)` — upload plain text
- `downloadBuffer(key)` — download as Buffer

## DB Columns Referencing S3 Keys

| Table | Column | Nullable | Content |
|-------|--------|----------|---------|
| `theologians` | `imageKey` | Yes | Portrait path |
| `results` | `contentKey` | Yes | Result JSON path (set on completion) |
| `reviewFiles` | `fileKey` | No | Original upload path |
| `reviewFiles` | `textStorageKey` | Yes | Extracted text path (set on completion) |

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `S3_BUCKET` | `theotank` | Private bucket name |
| `S3_PUBLIC_BUCKET` | `theotank-public` | Public bucket name |
| `S3_ENDPOINT` | `http://localhost:9000` | S3-compatible endpoint |
| `S3_ACCESS_KEY` | `minioadmin` | Access key |
| `S3_SECRET_KEY` | `minioadmin` | Secret key |
| `S3_PUBLIC_ASSET_URL` | `http://localhost:9000/theotank-public` | Base URL for public assets |
