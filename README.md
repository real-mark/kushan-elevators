# Kushan Elevators

A self-contained, hand-coded HTML/CSS/JavaScript website starter.

## Set up the site profile

Read [`SITE_PROFILE.md`](./SITE_PROFILE.md), then edit [`site-profile.json`](./site-profile.json). It is the single source for the site's public identity, copy, contact information, location, logo, navigation, and offerings.

## Build and preview

Run `node build.mjs` to validate the profile and generate the deployable static site in `dist/`. Open `dist/index.html` or serve the `dist/` folder locally.

Before deploying, set the profile `status` to `ready` only after the user confirms its details, then run `node build.mjs --release`. This rejects unresolved placeholders. Profile edits require a new build and deployment; no runtime remote configuration is used.

## Project files

- `site-profile.json` - editable source of truth for organization-wide details.
- `index.template.html` - source document rendered from the profile.
- `build.mjs` - dependency-free profile validation and static-site build.
- `styles.css` - responsive visual styles.
- `script.js` - small progressive-enhancement behaviors.
- `dist/` - generated deployment output; do not edit by hand.

Put approved local images in `assets/` and use paths such as `/assets/logo.svg` in the profile.

## Independence

All runtime files are local to this project. It does not import from the workspace, Test5, the shared component library, or another website.
