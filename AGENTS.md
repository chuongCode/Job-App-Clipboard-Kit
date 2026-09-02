# Repository guide

## README scope

Keep `README.md` focused on the extension itself: what it does, how to install and use it in Firefox, its profile behavior, permissions, and privacy characteristics. Put repository structure, local website preview commands, packaging rules, hosting configuration, deployment steps, and release-operator procedures in `AGENTS.md`, not the README.

## File structure

```text
Job-App-Clipboard-Kit/
├── extension/                    # Installable extension source only
│   ├── manifest.json
│   ├── background.js
│   ├── content-panel.js
│   ├── content-panel.css
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js
│   └── icons/
├── website/                     # Static landing page only
│   ├── index.html
│   ├── styles.css
│   ├── tokens.css
│   └── assets/
├── distribution/                 # Never include in the extension package
│   ├── updates.json
│   └── releases/                 # Mozilla-signed XPI files
├── .github/workflows/
│   └── deploy-distribution-pages.yml # Temporary fallback during Vercel migration
├── tools/
│   └── build-vercel-site.sh          # Assembles Vercel's static output
├── vercel.json                       # Vercel build and cache policy
└── README.md
```

Always package from inside `extension/`. Do not package the repository root: `website/`, `distribution/`, and `.github/` are publishing infrastructure and must not be included in the XPI.

## Website development

The website has no build step or external dependencies. Edit its files directly in `website/`; they are isolated from the installable extension source.

To preview the page from the repository root, run:

```sh
python3 -m http.server 8000 --directory website
```

Then open `http://localhost:8000`. The page renders in this mode, but its relative install and update-manifest links expect the combined deployment layout. To test the exact static output that Vercel will serve:

```sh
sh tools/build-vercel-site.sh
python3 -m http.server 8000 --directory .vercel-static
```

## Website hosting and deployment

Vercel is the target host. `vercel.json` runs `tools/build-vercel-site.sh`, which assembles `website/` and `distribution/` into `.vercel-static/`. The deployed landing page is at `/`, the Firefox update manifest is at `/updates.json`, and Mozilla-signed releases are under `/releases/`. Vercel must use the repository root as its Root Directory and the production deployment must be public over HTTPS.

The production endpoints will be:

```text
https://job-app-clipboard-kit.vercel.app/updates.json
https://job-app-clipboard-kit.vercel.app/releases/job-app-clipboard-kit-<version>.xpi
```

### Initial Vercel setup

1. Import the GitHub repository into Vercel and keep the project Root Directory at the repository root.
2. Use the **Other** framework preset. The committed `vercel.json` supplies the build command and output directory; do not override them in the dashboard.
3. Deploy `main`, choose or attach the permanent production domain, and keep deployment protection off for production so Firefox can fetch updates without authentication.
4. Verify `/`, `/updates.json`, and the current signed XPI under `/releases/`. Confirm that `/updates.json` revalidates rather than being cached long-term and that versioned XPIs may be cached immutably.
5. Keep the GitHub Pages workflow and old Pages deployment live until the update-channel cutover below is complete. Preview Vercel deployments must never be placed in `update_url` or `update_link` because their hostnames are not the permanent production endpoint.

### Update-channel cutover

The site links are relative, but Firefox's `update_url` and `update_link` are absolute. Moving those URLs is an extension release, not only a DNS or hosting change. Do not edit the currently published signed XPI.

1. After the permanent Vercel domain is live, create a new extension version and change `extension/manifest.json` `update_url` to `https://job-app-clipboard-kit.vercel.app/updates.json` without changing the stable extension ID.
2. Change the public website URL in `README.md` to the permanent Vercel URL.
3. Submit that extension version to Mozilla and obtain the Mozilla-signed XPI using the normal release workflow.
4. Publish the signed XPI on both hosts. While installed clients still use the GitHub Pages feed, update the old feed to advertise this bridge release from a URL that is publicly available. The bridge release then directs upgraded clients to the Vercel feed through its embedded `update_url`.
5. Verify the new install on Firefox, the Vercel update feed, and the Vercel XPI. Allow an overlap period before retiring GitHub Pages so existing installations have time to discover the bridge release.
6. Disable and remove `.github/workflows/deploy-distribution-pages.yml` only after the overlap period and after confirming that supported installations have migrated to the Vercel update feed.

The GitHub source link in `website/index.html` remains valid as long as the repository location does not change.

## Profile behavior

In Personal, First and Last are edited and copied separately, while clicking the Full Name label copies the combined full name. Click the Location label to copy the combined `[Address], [Location] [ZIP]` value. Use **Add +** to add another Experience position or an **Additional** link. The minus beside an Additional link removes it when the section is saved. Experience uses one date range with separate month and year controls for each half; choose `Present` as the end month for an ongoing role. Each displayed half can be copied independently. Experience positions and Education entries can be rearranged with the six-dot handle while their section is being edited, and the saved profile keeps that order. The saved profile is kept locally by `browser.storage.local`.

## Firefox release workflow

The stable Firefox extension ID is `job-app-clipboard-kit@extensions.local`. Never change it between releases. During the Vercel migration, the currently signed build continues using `https://chuongcode.github.io/Job-App-Clipboard-Kit/updates.json`; after the signed bridge release, new builds use `https://job-app-clipboard-kit.vercel.app/updates.json`.

For every release:

1. Confirm the working tree and current branch before changing release files. Preserve unrelated user changes. The release branch is normally `main`.
2. Make extension source changes only under `extension/`. Increase `version` in `extension/manifest.json` to a version higher than every previously released version, without changing the stable extension ID or `update_url`.
3. Run proportional checks on the extension source: validate JSON, check JavaScript syntax, and inspect the package contents.
4. Package only the contents of `extension/` into a ZIP for Mozilla submission. Never package the repository root or include `website/`, `distribution/`, `.github/`, or repository metadata. Store locally built submission archives in the ignored `web-ext-artifacts/` directory. From inside `extension/`, for example, run `zip -r ../web-ext-artifacts/job-app-clipboard-kit-<version>.zip .`.
5. Commit and push the source changes and manifest version bump. Keep `distribution/updates.json` on the currently published version at this stage.
6. Submit the ZIP to the existing Mozilla Developer Hub add-on as self-distributed/unlisted. Mozilla signing is a manual user step. Do not publish an unsigned locally built XPI; standard Firefox installations require Mozilla's signature.
7. When the user supplies the Mozilla-signed XPI, verify its embedded manifest version, extension ID, `update_url`, extension source contents, and `META-INF` signature files. Rename it to `job-app-clipboard-kit-<version>.xpi` and move it into `distribution/releases/`. Keep older signed XPIs for rollback or audit.
8. Update every versioned release reference in `website/index.html`, including the install link, signed-XPI inspection link, and displayed footer version.
9. Only after the signed XPI is in `distribution/releases/`, update `distribution/updates.json` to advertise that exact version and its final production URL `https://job-app-clipboard-kit.vercel.app/releases/job-app-clipboard-kit-<version>.xpi`. During the bridge release, follow the cutover procedure above so the old feed remains valid long enough to migrate existing installations.
10. Before publishing, verify that the source manifest version, signed XPI manifest version, update-feed version, website version and links, stable extension ID, XPI filename, and XPI URL all agree. Validate JSON, inspect the XPI signature entries, compare the signed XPI's extension files with `extension/`, and record a SHA-256 checksum.
11. Commit the signed XPI, update feed, and website references, then push them to `main`. Vercel automatically builds and deploys the combined static output.
12. Wait for the Vercel production deployment for that commit to complete successfully. Then verify the live landing page shows the new version and links to the new XPI, the live `updates.json` advertises the new version, and the public XPI downloads successfully. Compare the downloaded XPI's SHA-256 checksum and embedded manifest with the committed signed XPI.
13. Finish only after the working tree is clean, `main` matches `origin/main`, and all three public surfaces—the website, update manifest, and signed XPI—are confirmed live and consistent.

After every condition in step 13 is satisfied, end the release handoff with the exact standalone line `All hands off.` Do not use this signal earlier in the release process.

Never advance `distribution/updates.json` before Mozilla has signed the corresponding XPI and its public HTTPS download is available; doing so advertises a missing or unsigned update. `updates.json` represents the version currently offered to installed clients. Older signed XPIs may remain in `distribution/releases/` for rollback or audit purposes.

Mozilla signing remains manual. Vercel production deployment after a push to `main` is automatic once the Git repository is connected. Firefox update delivery is automatic for users whose installed signed build already contains the self-hosted `update_url`; temporary development installs and older builds without that URL are not on this update channel. Updates are periodic rather than immediate.
