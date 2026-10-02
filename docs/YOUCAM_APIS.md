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

## 7. AI Beard Style Generator ("finish the look")

```http
GET  /s2s/v2.0/task/template/beard-style   → 15 templates: all_shaved, all_goatee, all_circle, all_anchor, …
POST /s2s/v2.0/task/beard-style            { "src_file_id": "<image>", "template_id": "all_goatee" }
GET  /s2s/v2.0/task/beard-style/{task_id}  → results.url
```

- Applied to the **haircut try-on result**, not the original photo: the browser re-uploads the try-on image (cropped to 640 × 800) and runs the beard on it, so the user sees the whole barbershop look. Photo limits: long side under 1024 px, face width over 256 px, head turned less than 30°.
- Template ids, names and the barber wording for each are in `lib/addons.ts`; thumbnails are kept in `public/addons/beard/`.

## 8. AI Bangs (fringe) Generator

```http
GET  /s2s/v2.0/task/template/hair-bang   → 20 templates: male_* (10) and female_* (10)
POST /s2s/v2.0/task/hair-bang            { "src_file_id": "<image>", "template_id": "male_wispy_bangs" }
GET  /s2s/v2.0/task/hair-bang/{task_id}  → results.url
```

- The Men's list uses the `male_` set, Women's and All the `female_` set. Thumbnails in `public/addons/bangs/`.

## 9. AI Hair Color Virtual Try-On

```http
POST /s2s/v2.0/task/hair-color   { "src_file_id": "<image>", "pattern": { "name": "full" }, "palettes": [{ "color": "#3a2a20" }] }
GET  /s2s/v2.0/task/hair-color/{task_id}  → results.url  (returned as PNG)
```

- `pattern.name` is `full` or `ombre` (ombre takes two palettes plus `blend_strength`, `line_offset`, `coloring_section`); palettes accept `color_intensity` and `shine_intensity` (0–100). There are no templates (`GET …/template/hair-color` is empty). Cost: 1 unit.
- ManeRoute offers nine named colours with salon wording (`COLOURS` in `lib/addons.ts`). Results (colour comes back as PNG) are typed from the file's first bytes in `fetchResultImage`, so a missing or generic content type can't break re-using the image for the next finish.

## 10. AI Hair Frizziness Detection (part of the hair check)

```http
POST /s2s/v2.0/task/hair-frizziness-detection   { "src_file_ids": ["<front>", "<left>", "<right>"] }
GET  /s2s/v2.0/task/hair-frizziness-detection/{task_id}
→ results.hair_frizziness = { "term": "Not Frizzy" | "Slightly Frizzy" | "Frizzy" | "Extreme Frizzy", "mapping": 0–3 }
```

- Uses the same three photos as the texture scan (front, left, right). ManeRoute maps the terms to low / medium / high / high (`lib/hairCheck.ts`). "High" adds rule R8 on sleek straight looks and routine step RT16.

## 11. AI Hair Density Detection (part of the hair check)

```http
POST /s2s/v2.0/task/hair-density-detection   { "src_file_id": "<head-lowered photo>" }
GET  /s2s/v2.0/task/hair-density-detection/{task_id}
→ results.hair_density = { "term": "Extremely Low Density" | "Low Density" | "Medium Density" | "High Density", "mapping": "2.16" }
```

- Needs its **own photo**: face the camera, then lower the head about 45° with the hairline in view and hair untied. A normal front photo fails with `error_face_angle_invalid` (checked 2 Oct 2026), so the hair check's third camera shot is "lower your head".
- Low → rule R7 (fewer, longer layers on layered cuts) and routine step RT17; high → R7 on one-length shapes.

Request shapes for sections 7–11 were confirmed with live calls on 2 Oct 2026; the result shapes and photo rules come from YouCam's OpenAPI files (mirrored at github.com/api-evangelist/perfect-corp, because the docs host is blocked on our network). Successful beard, fringe and colour results were checked visually. Density and frizz have not yet had a successful call with real photos of a person (see MANUAL_TASKS T15).

## Units per consultation

| Step | Units |
| --- | --- |
| Hair Length Detection | 2 |
| Hair Type Detection (optional texture scan) | 2 |
| Target preview (Hairstyle VTO) | 2 |
| Planning-stage preview (gap of two or more bands) | 2 |
| Your cut, grown (Hair Extension, length-building routes) | 1 |
| **Total** | **4–9** |

## Units per journey check-in

| Step | Units |
| --- | --- |
| Hair Length Detection on the new photo | 2 |
| The destination re-rendered on the new photo (Hairstyle VTO) | 2 |
| **Total** | **about 4** |

The two run in parallel on the same uploaded file. If the re-render fails, the measurement is still saved.

## Data retention (YouCam side)

Uploaded files and task ids are kept for **30 days**, and result download links last **2 hours**. ManeRoute tells the user this on the consent screen.
