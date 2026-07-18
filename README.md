# Photography Gallery — endless scroll, multi-view, tag filters

Plain HTML/CSS/JS, no build step — same deploy process as before.

## Deploying

1. Create a repo named `your-username.github.io` (or reuse your existing one)
2. Upload everything in this folder (`index.html`, `.nojekyll`, `assets/`) to it
3. Settings → Pages → Source: "Deploy from a branch" → `main` → `/ (root)` → Save
4. Visit `https://your-username.github.io`

## What's in this version

- **Endless scroll** — every photo is already on the page; each one lazy-loads
  from the network only as it nears the viewport (`loading="lazy"`) and fades
  in on scroll, so nothing loads all at once.
- **5 views** — Small / Medium / Large grid, Masonry, and List. Switch anytime
  via the buttons in the control bar.
- **Tag filters** — built automatically from each photo's tags. Selecting
  multiple tags narrows results to photos matching **all** selected tags
  (not any).
- **Sort** — Curated order (however you arrange the `<figure>` blocks),
  Newest/Oldest (by `data-date`), or Title A–Z.
- **Remembers your last view, sort, filters, and whether the bar was open** —
  saved in the browser's local storage, restored next visit (same browser/device only).
- **Lightbox** — shows only the photo's description (no tags). Left/right
  neighbors are preloaded in the background so navigating feels instant and
  the image and caption always change together — no more "text updates
  before the picture" lag.

## Adding a photo

Every photo is one `<figure class="photo">` block in `index.html`. Copy an
existing one and edit:

```html
<figure class="photo"
  data-tags="portrait, travel"
  data-title="Your Title"
  data-location="City, Country"
  data-date="2026-07-18"
  data-description="The longer story or context — shown only in the lightbox.">
  <div class="photo__frame">
    <img src="assets/images/yourfile.jpg" data-full="assets/images/yourfile.jpg" alt="Your Title" loading="lazy">
    <div class="photo__hover-caption">City, Country · July 2026</div>
  </div>
  <div class="photo__list-info">
    <h3>Your Title</h3>
    <p>City, Country · July 2026</p>
  </div>
</figure>
```

Field by field:
- `data-tags` — comma-separated, becomes filter buttons automatically
- `data-title` — used in List view and as the lightbox image's alt text
- `data-location` — shown on hover (grid views) and in List view
- `data-date` — **ISO format** `YYYY-MM-DD`, used only for Newest/Oldest sort
- `data-description` — the only thing shown in the lightbox on click
- `src` / `data-full` — thumbnail and full-size image. Can be the same file if
  you don't have a separate larger version.
- The `photo__hover-caption` and `photo__list-info` text — just type the
  location and "Month Year" yourself to match `data-date`; these are shown as
  plain text, not calculated automatically.

To upload your own image file: go into `assets` → **Add file → Upload
files** → create/upload into an `images` folder → reference it as
`assets/images/yourfile.jpg`.

## File map

```
index.html          heading, control bar, photo grid, lightbox, footer
assets/css/main.css  all styling — including the 5 view-mode layouts
assets/js/main.js    filtering, sorting, view switching, persistence,
                      scroll fade-in, lightbox preloading
.nojekyll            tells GitHub Pages not to run a build
```
