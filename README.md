# Make, Play, Remix

A free little garden for ages 2-3, with a grown-up nearby. Make a watering
can, grow a flower, build a boat, and take that flower for a ride. Toys stay
in your garden instead of disappearing after a puzzle.

**[Play Make, Play, Remix](https://ashleywolf.github.io/toddler-puzzles/)**

## Playing together

Tap a piece, then its matching outline, or drag it there. Completed toys
appear in the garden. Select a toy, then a large garden destination:
watering cans water seeds, boats move between pond shores, and wagons move
along the path. Select a grown flower, then a boat or wagon
to carry it. Select it again to transfer it to another toy or the seedbed.

Grown-ups -> Open garden settings selects another toy or 2, 3, or 4 pieces.
There are no paid or earned unlocks. The workbench shows at most two loose
pieces at once. Try a new look previews a reversible alternative; Use this
look applies it without losing position or cargo.

Sound starts off each visit. Grown-ups can enable gentle sounds or mute all
of them. Silent play is fully supported. Reset requires adult confirmation;
changing toys or leaving a puzzle keeps creations.

## Offline and privacy

The first visit needs a connection. Wait for **Ready offline** in garden
settings before going offline. Browser storage can be cleared or evicted;
offline availability is not permanent. Updates wait for a grown-up to save
and refresh. There are no external images, fonts, runtime libraries, or content
downloads.

Saved creations stay in local browser storage, separately for each device,
browser, and origin. No names, accounts, photos, ads, analytics, permissions,
or uploads. GitHub Pages may keep ordinary hosting logs. Clearing browser
storage removes both saved creations and offline availability.

The two-step grown-up panel prevents some accidental changes, not determined
access; it is not authentication. Use with caregiver supervision. No claims
of developmental benefits, therapeutic effects, or universal calming.

## Local development

Open `index.html` directly on a desktop, or serve the directory:

```sh
python3 -m http.server 8000
```

Service workers need HTTPS or localhost. iOS Files previews are not a
reliable way to run HTML; use the hosted link in Safari instead.

```sh
npm ci
npx playwright install chromium webkit
npm test
npm run test:report
```

Browser E2E tests cover construction, connected play, remixes, persistence,
input cancellation, offline loading, and responsive targets. Screenshots and
an HTML report are generated in ignored test-output directories.
Chromium and emulated iPad WebKit coverage do not replace physical device
checks or observing whether a toddler understands the game.

## Publishing

GitHub Pages uses the included Actions workflow, after both browser projects
pass. A downloadable browser report and screenshot sequence are retained
as the workflow's `browser-play-report` artifact. Only `index.html`, `sw.js`,
the manifest, and icon are deployed. Bump the service worker cache version
whenever public assets change; compatible saved state remains versioned
separately. Never clear another project's same-origin cache or storage.

Artwork is original inline SVG. The connected play loop draws on general
construction and cause-and-effect play ideas, not copied characters or assets.
