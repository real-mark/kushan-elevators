# Website Agent Instructions

- Read `SITE_PROFILE.md` and `site-profile.json` before changing organization identity, contact details, location, logo, or organization-wide copy.
- `site-profile.json` is the canonical site profile. Update it when the user provides or requests verified profile details; do not duplicate those values in HTML, CSS, or JavaScript.
- Keep page-specific copy in the relevant source template. Use the profile for facts and copy that repeat across the site.
- Preserve existing profile values unless the user asks to change them. Leave unknown facts blank or marked `TODO`; never infer addresses, email, phone numbers, claims, or testimonials.
- Keep `schemaVersion` at 1 unless deliberately migrating the profile schema.
- Treat the profile as public website content. Never put passwords, API keys, or other secrets in it.
- Put approved local assets in `assets/` and update `brand.logoPath` and `brand.logoAlt`.
- Run `node build.mjs` after profile or page changes to create a preview. The starter profile contains `TODO` copy, so a draft preview can show it; never publish that preview. Replace every `TODO` with verified content, set `status` to `ready` only after confirmation, and run `node build.mjs --release` before deployment.
- Never import or link to code from another website, `Test5/`, or `_master-library/` at runtime.
- If this project is still inside the Universal Site Builder workspace, read the workspace-root `WEBSITE_BUILDER_MANUAL.md` before using workspace tasks or publishing. This file remains the guide for site-local edits and builds.

## Template and generated output

- In the source `index.template.html`, keep `__PROFILE_NAME__` and the `{{SITE_*}}` placeholders exactly as written; do not replace them with site-specific content or remove/rename them. They are template instructions for the builder, not text for visitors. The generated site's `build.mjs` fills them using that site's `site-profile.json`; the built `dist/index.html` must contain the actual profile values, not these tokens. If a placeholder is intentionally added, removed, or renamed, update the build script's replacement map and verify the generated page.
- Never edit generated output such as `dist/index.html` as source. `node build.mjs` rebuilds and overwrites `dist/` from the profile, HTML template, CSS, JavaScript, and approved assets.
- A `TODO` in the profile is allowed only while the site is a draft. Do not mark the site ready or publish until all public copy is confirmed and the release build passes.
- Changes made to the workspace's Pure Static template affect newly generated sites only. Existing sites are independent; update their own source files deliberately.
