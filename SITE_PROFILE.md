# Site Profile

Edit [`site-profile.json`](./site-profile.json) for organization-wide facts and copy. The build reads this file to render the deployable HTML.

| Field                             | Use                                                             |
| --------------------------------- | --------------------------------------------------------------- |
| `identity.name`                   | Public display name used in the header, footer, and page title. |
| `identity.legalName`              | Optional legal name.                                            |
| `identity.siteUrl`                | Optional canonical website URL.                                 |
| `identity.tagline`                | Short brand line used in the homepage hero.                     |
| `identity.description`            | Search and social description.                                  |
| `identity.about`                  | Verified About Us copy.                                         |
| `identity.whatWeDo`               | Concise description of the organization's work.                 |
| `brand.logoPath`, `brand.logoAlt` | Optional local logo under `assets/` and its accessible text.    |
| `location`                        | Optional structured postal address; blank fields are omitted.   |
| `contact`                         | Optional public email, phone, or contact-page URL.              |
| `navigation`                      | Site-wide navigation labels and destinations.                   |
| `offerings`                       | Optional verified services or offerings shown on the homepage.  |

Keep unknown values empty or marked `TODO`. Do not mark `status` as `ready` until the user confirms the information is complete. Run `node build.mjs --release` before deployment; the check rejects draft profiles and unresolved placeholders.

The profile is public website content, not a secrets store. Changes take effect after a successful build and deployment.
