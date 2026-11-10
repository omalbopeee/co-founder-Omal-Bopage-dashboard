# Omal Bopage — TapX Card Studio

A static digital card editor ready for GitHub Pages. Edit Omal's profile, portrait, contact buttons, website, social links, company details, products and card design, with an interactive live preview.

## Host on GitHub Pages

This folder is the source for [omalbopeee/co-founder-Omal-Bopage-dashboard](https://github.com/omalbopeee/co-founder-Omal-Bopage-dashboard).

1. Commit and push these files to the repository's **main** branch.
2. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Open **Actions → Deploy GitHub Pages**. The workflow runs on pushes to main; you can also choose **Run workflow**.
4. Open the site URL shown by the successful deployment.

The expected default project address is https://omalbopeee.github.io/co-founder-Omal-Bopage-dashboard/ once deployment succeeds. The saved card opens at **card.html** on the same site.

The included workflow tests the code, builds **pages-dist/** and deploys only that static output. No npm packages, account tokens or custom secrets are required by the project. The workflow follows [GitHub's Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Saving edits

**Save changes stores edits only in this browser and device.** Returning to the same site in the same browser restores the saved card. It does not upload edits to GitHub, sync them to other devices, or update the original public card. Clearing site storage removes saved edits. The dashboard displays this limit.

Live preview follows the draft; Preview opens an interactive mobile/desktop view. View saved card opens the saved version. Discard restores the last save. Reset restores the original card into the draft; Save changes applies it. Unfinished edits can be restored from browser draft storage. Personal and company vCards are generated from the current details when downloaded.

The managed card URL and TapX branding stay fixed, as in the previous editor. Shared online saving would require a backend; GitHub Pages serves this app as static files.

## Local preview and checks

Install Node.js 20 or newer and double-click **start-dashboard.cmd**, or run **npm start**. Open http://127.0.0.1:4174 and keep the terminal open. Local preview uses the same browser storage as the hosted version; each site address has its own saved edits.

- **npm test** runs model, browser-storage, static build and preview checks with Node's built-in test runner.
- **npm run build** creates a fresh **pages-dist/** ready for static hosting. Generated files are excluded from Git.
- **npm run preview** serves that built output at the same local address.

No dependency installation is needed. Change the PORT environment variable if 4174 is already in use.

## Files

- **public/**: the static editor, saved-card page, browser storage, styles and used assets.
- **scripts/**: static build and local preview helpers.
- **test/**: checks used locally and by the deployment workflow.
- **.github/workflows/pages.yml**: GitHub Pages deployment configuration.

The former disk-save server, API shim, default-only data folder, unused share image and fixed contact files have been removed. The original profile website lives separately in the neighbouring co-founder-Omal-Bopage folder.
