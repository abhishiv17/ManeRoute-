# YouCam APIs used

Everything below was checked against the live API on 28 Sep 2026 with a real key. Sources: [Quick start](https://docs.perfectcorp.com/develop/quick_start_guide), [Hair Length Detection](https://docs.perfectcorp.com/reference/ai_hair_length_detection), [Hairstyle VTO](https://docs.perfectcorp.com/reference/ai_hairstyle), [File retention](https://docs.perfectcorp.com/develop/file_retention_period).

- **Server:** `https://yce-api-01.makeupar.com`
- **Auth:** `Authorization: Bearer <YOUCAM_API_KEY>`, sent from server code only

## 1. File API: register and upload the photo

```http
POST /s2s/v2.0/file
{ "files": [{ "content_type": "image/jpeg", "file_name": "capture.jpg", "file_size": 183422 }] }
```
The response is `data.files[0].file_id` plus `data.files[0].requests[0]` = `{ url, method: "PUT", headers }`. ManeRoute then `PUT`s the bytes to that presigned URL with the given headers.

Code: `lib/youcam/client.ts → uploadImage()`.

## 2. AI Hair Length Detection v1.0 (required API 1)

```http
POST /s2s/v2.0/task/hair-length-detection   { "src_file_id": "<file_id>" }
→ { "status": 200, "data": { "task_id": "…" } }

GET  /s2s/v2.0/task/hair-length-detection/{task_id}
→ { "data": { "task_status": "running" | "success" | "error",
              "error": null | "<engine code>",
              "results": { "hair_length": { "term": "above chest or longer" } } } }
```

| `term` returned by YouCam | ManeRoute band | `atLeast` |
| --- | --- | --- |
| above the ears | `above_ears` | false |
| ear length | `ear_length` | false |
| ear length or longer | `ear_length` | **true** |
| short hair | `short` | false |
| short hair or longer | `short` | **true** |
| above chest | `above_chest` | false |
| above chest or longer | `above_chest` | **true** |
| long hair | `long` | false |

- **Input:** JPG or PNG, 320–4096 px per side, under 10 MB, front-facing selfie with hair down.
- **Cost:** 2 units. No units are consumed while the task is running.
- **Errors handled:** `error_below_min_image_size`, `error_face_position_invalid`, `error_face_position_too_small`, `error_face_position_out_of_boundary`, `error_insufficient_lighting`, `error_face_angle_invalid`, plus generic engine errors.

Code: `app/api/length/*`, `lib/length.ts`.

## 3. AI Hairstyle Virtual Try-On v2.1 (required API 2)

```http
POST /s2s/v2.1/task/hair-transfer
{ "src_file_id": "<file_id>", "template_id": "female_medium_straight", "hair_color": "src" }
→ { "data": { "task_id": "…" } }

GET /s2s/v2.1/task/hair-transfer/{task_id}
→ { "data": { "task_status": "success", "results": { "url": "https://…s3…" } } }
```

- `hair_color: "src"` keeps the user's own colour on templates where `keep_users_color` is true, so the preview shows shape and length rather than a colour change.
- **Input:** JPG, long side ≤ 1024 px, face width ≥ 128 px, head roughly frontal, shoulders visible, one face.
- **Cost:** 2 units per preview in v2.1 preset mode, so a route with a planning stage costs 4.
- **Errors handled:** `error_no_shoulder`, `error_large_face_angle`, `error_insufficient_landmarks`, `error_hair_too_short`, `error_face_pose`, `error_no_face`, `error_nsfw_content_detected` and others (`lib/youcam/errors.ts`).
- **Result:** the download URL is valid for 2 hours. ManeRoute downloads it on the server right away and returns it to the browser as a data URL.

Code: `app/api/vto/*`.

## 4. Template list (used to curate the catalog)

```http
GET /s2s/v2.1/task/template/hair-transfer?page_size=20&starting_token=…
→ { "data": { "templates": [{ "id", "title", "thumb", "category_name", "keep_users_color" }], "next_token" } }
```

This returned 116 templates on 28 Sep 2026. Run `npm run templates` to list them.

### Curated catalog

58 of the 116 templates are used: 17 **barbershop** and 41 **salon** haircuts. Colour-only looks, updos, buns, braids and accessories are excluded because they are styling, not a cut. The table of template id, name, collection, length band, upkeep and flags lives in [`scripts/build-catalog.mjs`](../scripts/build-catalog.mjs), which generates `lib/catalog.ts`.

YouCam doesn't publish a length for templates. Every band was checked by eye against the style picture in `public/styles`. 20 of those pictures are YouCam's own template thumbnails; the other 38 were generated with real YouCam Hairstyle VTO runs on YouCam sample model photos (28 Sep 2026, 80 units), so the picker works on any network.

The collection is chosen by the user. ManeRoute never infers gender or any other trait from the photo, and style names never use gendered words.

## 5. AI Hair Type Detection v1.0 (texture scan)

```http
POST /s2s/v2.0/task/hair-type-detection   { "src_file_ids": ["<front>", "<head turned right>", "<head turned left>"] }
GET  /s2s/v2.0/task/hair-type-detection/{task_id}
→ { "data": { "task_status": "success", "results": { "hair_type": { "mapping": "2a to 2b", "term": "Slight to Medium Wavy" } } } }
```

- All three photos must be **the same size**. ManeRoute crops every capture to 640 × 800 on the device.
- Side photos must be turned more than 15°. Sending the front photo three times returns `error_face_angle_invalid` (checked 28 Sep 2026), so the app runs a guided, hands-free 3-second shot for each side.
- The nine documented ranges map to straight / wavy / curly / coily (`lib/texture.ts`). Unknown values count as "not scanned".
- Cost: 2 units. Failure is non-blocking: the user can continue without texture or retake the side photos.
- Spec source: the docs site is blocked on some networks, so the spec was read from a public OpenAPI mirror (github.com/api-evangelist/perfect-corp) and verified with live calls.

## 6. AI Hair Extension VTO v1.0 ("your cut, grown")

```http
GET  /s2s/v2.0/task/template/hair-ext      → all_length_1, all_length_2_, all_length_3
POST /s2s/v2.0/task/hair-ext               { "src_file_id": "<front>", "template_id": "all_length_1" }
GET  /s2s/v2.0/task/hair-ext/{task_id}     → results.url
```

- The template keeps the user's own cut and colour and adds length. Checked visually on 28 Sep 2026: `all_length_1` reaches chest length, and `all_length_2_` and `all_length_3` fall well below the chest.
- ManeRoute maps a medium target to `all_length_1` and a long target to `all_length_2_`. Cost: 1 unit.

## Units per consultation

| Step | Units |
| --- | --- |
| Hair Length Detection | 2 |
| Hair Type Detection (optional texture scan) | 2 |
| Target preview (Hairstyle VTO) | 2 |
| Planning-stage preview (gap of two or more bands) | 2 |
| Your cut, grown (Hair Extension, length-building routes) | 1 |
| **Total** | **4–9** |

## Data retention (YouCam side)

Uploaded files and task ids are kept for **30 days**, and result download links last **2 hours**. ManeRoute tells the user this on the consent screen.
