# Make, Play, Remix

A free little garden for ages 2-3, with a grown-up nearby. Make a watering
can, grow a flower, build a boat, and take that flower for a ride. Toys stay
in your garden instead of disappearing after a puzzle.

**[Play Make, Play, Remix](https://ashleywolf.github.io/toddler-puzzles/)**

## Playing together

Start with the watering can. Tap a piece, then the matching shape with
the thick outline, or drag the piece there. A small picture shows the
whole toy coming together. The garden stays out of the way while building.

When the toy is ready, one big picture button shows what to do: water the
seeds, bring the flower aboard, sail across the pond, or roll along the path.
Each action needs just one tap. The shared garden shows the result.
Choose another toy using the two picture buttons below; settings are not needed.

There are no paid or earned unlocks. The workbench shows at most two loose
pieces at once. **Try a different look** opens reversible part remixes.
**Explore the garden yourself** optionally opens the original drag/tap play:
select a toy or flower, then a highlighted destination. Neither panel is
needed for the main play loop. Grown-ups -> Open garden settings changes
the number of pieces to 2, 3, or 4 and also offers a toy selector.

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

Browser E2E tests cover the visible, settings-free play loop, compact phone
layouts, construction, connected play, remixes, persistence,
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
