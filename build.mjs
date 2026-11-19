import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const profilePath = path.join(projectRoot, "site-profile.json");
const profile = JSON.parse(await readFile(profilePath, "utf8"));
const releaseCheck = process.argv.includes("--release");
const failures = [];

await validateProfile(profile);
if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  const template = await readFile(
    path.join(projectRoot, "index.template.html"),
    "utf8",
  );
  const output = render(template);
  if (/\{\{[A-Z_]+\}\}|__PROFILE_[A-Z_]+__/.test(output))
    throw new Error("Unresolved profile token remains in the generated HTML.");

  const dist = path.resolve(projectRoot, "dist");
  if (path.dirname(dist) !== projectRoot)
    throw new Error("Build output must remain inside this project.");
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  await writeFile(path.join(dist, "index.html"), output);
  await cp(path.join(projectRoot, "styles.css"), path.join(dist, "styles.css"));
  await cp(path.join(projectRoot, "script.js"), path.join(dist, "script.js"));
  const assets = path.join(projectRoot, "assets");
  try {
    await access(assets);
    await cp(assets, path.join(dist, "assets"), { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  console.log(`Static site built: ${dist}`);
}

async function validateProfile(value) {
  if (!isRecord(value)) {
    failures.push("The profile must be a JSON object.");
    return;
  }
  if (value.schemaVersion !== 1) failures.push("schemaVersion must be 1.");
  if (!["draft", "ready"].includes(value.status))
    failures.push('status must be either "draft" or "ready".');

  const identity = isRecord(value.identity) ? value.identity : {};
  const brand = isRecord(value.brand) ? value.brand : {};
  const location = isRecord(value.location) ? value.location : {};
  const contact = isRecord(value.contact) ? value.contact : {};
  for (const field of ["name", "tagline", "description", "about", "whatWeDo"])
    requiredText(identity[field], `identity.${field}`);
  for (const field of ["legalName", "siteUrl"])
    optionalText(identity[field], `identity.${field}`);
  for (const field of ["logoPath", "logoAlt"])
    optionalText(brand[field], `brand.${field}`);
  for (const field of [
    "streetAddress",
    "locality",
    "region",
    "postalCode",
    "country",
  ])
    optionalText(location[field], `location.${field}`);
  for (const field of ["email", "phone", "pageUrl", "actionLabel"])
    optionalText(contact[field], `contact.${field}`);

  if (
    typeof contact.email === "string" &&
    contact.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)
  )
    failures.push("contact.email must be a valid email address.");
  if (
    typeof identity.siteUrl === "string" &&
    identity.siteUrl &&
    !isHttpUrl(identity.siteUrl)
  )
    failures.push("identity.siteUrl must be an absolute HTTP(S) URL.");
  if (
    typeof contact.pageUrl === "string" &&
    contact.pageUrl &&
    !isSafeLink(contact.pageUrl)
  )
    failures.push("contact.pageUrl must be an internal path or HTTP(S) URL.");

  if (typeof brand.logoPath === "string" && brand.logoPath) {
    if (
      !/^\/assets\/(?:[^/]+\/)*[^/]+$/.test(brand.logoPath) ||
      brand.logoPath.includes("..") ||
      brand.logoPath.includes("\\") ||
      typeof brand.logoAlt !== "string" ||
      !brand.logoAlt.trim()
    ) {
      failures.push(
        "A logo must use a safe /assets/ path and include descriptive logoAlt text.",
      );
    } else {
      const assetsRoot = path.resolve(projectRoot, "assets");
      const logoPath = path.resolve(
        assetsRoot,
        brand.logoPath.slice("/assets/".length).split("/").join(path.sep),
      );
      if (!logoPath.startsWith(`${assetsRoot}${path.sep}`)) {
        failures.push("brand.logoPath must stay inside assets/.");
      } else {
        try {
          await access(logoPath);
        } catch (error) {
          if (error.code === "ENOENT")
            failures.push(`Logo file does not exist: ${brand.logoPath}`);
          else throw error;
        }
      }
    }
  }
  if (
    (contact.email || contact.phone || contact.pageUrl) &&
    typeof contact.actionLabel === "string" &&
    !contact.actionLabel.trim()
  )
    failures.push(
      "contact.actionLabel must not be empty when contact is shown.",
    );

  if (!Array.isArray(value.navigation)) {
    failures.push("navigation must be an array.");
  } else {
    value.navigation.forEach((link, index) => {
      if (!isRecord(link)) {
        failures.push(`navigation[${index}] must be an object.`);
        return;
      }
      requiredText(link.label, `navigation[${index}].label`);
      requiredText(link.href, `navigation[${index}].href`);
      if (typeof link.href === "string" && !isSafeLink(link.href))
        failures.push(
          `navigation[${index}].href must be an internal path or HTTP(S) URL.`,
        );
    });
  }

  if (!Array.isArray(value.offerings)) {
    failures.push("offerings must be an array.");
  } else {
    value.offerings.forEach((offering, index) => {
      if (!isRecord(offering)) {
        failures.push(`offerings[${index}] must be an object.`);
        return;
      }
      requiredText(offering.name, `offerings[${index}].name`);
      requiredText(offering.description, `offerings[${index}].description`);
    });
  }

  if (releaseCheck) {
    if (value.status !== "ready")
      failures.push('Set status to "ready" only after confirming the profile.');
    findPlaceholders(value, "site profile");
  }

  function requiredText(text, label) {
    if (typeof text !== "string" || !text.trim())
      failures.push(`${label} must be a non-empty string.`);
  }

  function optionalText(text, label) {
    if (typeof text !== "string") failures.push(`${label} must be a string.`);
  }

  function findPlaceholders(item, label) {
    if (typeof item === "string") {
      if (/\bTODO\b|\{\{[^}]+\}\}|\{Entity_Name\}/i.test(item))
        failures.push(`Replace unresolved placeholder in ${label}.`);
    } else if (Array.isArray(item)) {
      item.forEach((entry, index) =>
        findPlaceholders(entry, `${label}[${index}]`),
      );
    } else if (isRecord(item)) {
      for (const [key, nestedValue] of Object.entries(item))
        findPlaceholders(nestedValue, `${label}.${key}`);
    }
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isSafeLink(value) {
  if (/[\\\u0000-\u001f]/.test(value)) return false;
  return (
    value.startsWith("#") ||
    (value.startsWith("/") && !value.startsWith("//")) ||
    isHttpUrl(value)
  );
}

function render(template) {
  const identity = profile.identity;
  const brand = profile.brand;
  const contact = profile.contact;
  const location = Object.values(profile.location)
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ");
  const logo = brand.logoPath
    ? `<img class="brand-logo" src="${escapeHtml(brand.logoPath.slice(1))}" alt="${escapeHtml(brand.logoAlt)}">`
    : escapeHtml(identity.name);
  const offerings = profile.offerings
    .map(
      (offering) =>
        `<li><h3>${escapeHtml(offering.name)}</h3><p>${formatText(offering.description)}</p></li>`,
    )
    .join("\n");
  const contactItems = [];
  if (contact.email)
    contactItems.push(
      `<li><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></li>`,
    );
  if (contact.phone) {
    const phoneHref = contact.phone.replace(/[^\d+*#,;]/g, "");
    contactItems.push(
      `<li><a href="tel:${escapeHtml(phoneHref)}">${escapeHtml(contact.phone)}</a></li>`,
    );
  }
  if (contact.pageUrl)
    contactItems.push(
      `<li><a href="${escapeHtml(contact.pageUrl)}">${escapeHtml(contact.actionLabel || "Contact")}</a></li>`,
    );
  const contactSection = contactItems.length
    ? `<section id="contact" class="content-section" aria-labelledby="contact-title"><p class="eyebrow">Contact</p><h2 id="contact-title">${escapeHtml(identity.name)}</h2><ul class="contact-list">${contactItems.join("\n")}</ul></section>`
    : "";
  const navigationLinks = profile.navigation.map(
    (link) =>
      `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`,
  );
  if (contactItems.length)
    navigationLinks.push('<a href="#contact">Contact</a>');
  const replacements = {
    __PROFILE_NAME__: escapeHtml(identity.name),
    "{{SITE_TAGLINE}}": formatText(identity.tagline),
    "{{SITE_DESCRIPTION}}": escapeHtml(identity.description),
    "{{SITE_ABOUT}}": formatText(identity.about),
    "{{SITE_WHAT_WE_DO}}": formatText(identity.whatWeDo),
    "{{SITE_LOGO}}": logo,
    "{{SITE_CANONICAL}}": identity.siteUrl
      ? `<link rel="canonical" href="${escapeHtml(identity.siteUrl)}">`
      : "",
    "{{SITE_LOCATION}}": location
      ? `<p class="location"><strong>Location</strong><br>${location}</p>`
      : "",
    "{{SITE_OFFERINGS}}": offerings
      ? `<ul class="offering-list">${offerings}</ul>`
      : "",
    "{{SITE_NAVIGATION}}": navigationLinks.join("\n"),
    "{{SITE_CONTACT_SECTION}}": contactSection,
  };
  let html = template;
  for (const [token, replacement] of Object.entries(replacements))
    html = html.split(token).join(replacement);
  return html;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatText(value) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}
