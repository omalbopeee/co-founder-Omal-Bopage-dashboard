# Omal Bopage — TapX Card Studio

A separate editor using the same navy/red Card Studio dashboard as the previous card project. Its live preview preserves Omal's portrait, warm card design, contact buttons, social links, and the TapX About / Solutions / Products dialog.

## Open

Install Node.js 20 or newer, then double-click **start-dashboard.cmd**. Keep the terminal window open while editing. The dashboard opens at **http://127.0.0.1:4174**; the saved card is at **http://127.0.0.1:4174/card**.

Alternatively, run `npm.cmd start` in this folder. No dependency installation is required. Port 4174 keeps this editor separate from the previous dashboard on 4173. If needed, set `PORT` to a free port before starting.

## Edit and save

- **Profile & photo:** name, role, company, saved-contact name, portrait upload, photo description and crop position.
- **Contact details:** the three fixed Call, WhatsApp and Email buttons, plus the optional My website tile.
- **Social media:** edit, add, reorder, hide and remove social links.
- **Company & products:** business contact details, logo upload, About copy, and products with image uploads, descriptions and gallery labels. Reordering products updates both Solutions and Products.
- **Design & wording:** colours, section visibility, headings, descriptions and editable button labels. TapX branding, footer and the managed public card URL remain fixed, matching the previous editor.

The live preview follows your draft. **Preview** opens a larger interactive mobile/desktop view, including social and company dialogs, product zoom and contact downloads. **Save changes** persists your card; **View saved card** opens that version. Discard restores the last save. Reset restores the original Omal card into the draft and requires Save changes to persist it. Unfinished edits can be recovered from browser draft storage.

Personal and company contact downloads generate separate `.vcf` files using the current card details.

## Storage and the original website

Local saves go into `data/card.json`; the preceding save is kept in `data/card.previous.json`. Back up the entire folder to preserve your saved content and uploads. The server listens only on this computer.

This is an independent editor in `co-founder-Omal-Bopage-dashboard/`, beside the original `co-founder-Omal-Bopage/` website folder. Saving here updates its own saved card. It does **not** overwrite the original website's `index.html`, `profile.js`, or the public website at `https://co-founder.omal-bopage.tapx.lk/`. Publishing that website requires a separate hosting update.

## Static build

Run `npm.cmd run build` to generate `pages-dist/`, which can be hosted as a separate static site, including under a project subdirectory. In that build, Save changes stores records only in the current browser and device. The dashboard displays this storage limit. It does not upload edits or provide shared online saving.

Only the frontend in `public/` is copied to the static build; local `data/` is excluded. No deployment is performed by the build command.

## Checks

Run `npm.cmd test` for validation, separate contact generation, persisted edits, backups, save conflicts and API checks. Tests use Node's built-in test runner and isolated temporary records; no packages are required.

`public/` contains the editor, card preview, styles and local assets. `server.mjs` provides the local save API. `scripts/` contains the static build helper.
