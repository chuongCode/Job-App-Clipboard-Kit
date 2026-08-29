# Job App Clipboard Kit

Job App Clipboard Kit is a lightweight, local-only browser extension that keeps frequently used job application details within easy reach. Inspired by the functionality of Simplify Copilot's clipboard feature.

Click the toolbar icon to toggle a floating profile panel in the current webpage, then click any value to copy only that value. The panel remains open while you interact with the page. Use a section's pencil to update its values; **Save** stores them in Firefox's local extension storage so they remain available after the panel or browser closes.

The extension has no backend, analytics, external requests, or third-party dependencies. Its small content script only creates and toggles the floating panel; it does not inspect forms or page data.

## Repository layout

- `extension/` contains every file that belongs in the installable extension.
- `distribution/updates.json` is the Firefox self-hosted update manifest.
- `distribution/releases/` holds Mozilla-signed `.xpi` releases.

Always package from inside `extension/`. Do not package the repository root: `distribution/` and `.github/` are publishing infrastructure and must not be included in the XPI.

## Load temporarily in Firefox

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select `extension/manifest.json`.
5. Pin **Job App Clipboard Kit** to the toolbar if you want it to remain visible.
6. Open a normal webpage and click the toolbar icon to show or hide the floating panel. The X also closes it.

Temporary extensions are removed when Firefox exits.

## Permanent installation

Or if you don't want to deal with all that, you can download the latest Mozilla-signed Firefox build:
https://addons.mozilla.org/developers/addon/3062147/versions

Open the `.xpi` in Firefox and confirm the installation prompt.

The panel can be injected into regular `http`, `https`, and permitted `file` pages. Firefox blocks extensions from injecting into internal pages such as `about:debugging`, the built-in PDF viewer, and other protected browser pages. Navigating or reloading the tab removes the panel; click the toolbar icon to inject it again.

## Reload changes during development

After changing a source file, return to `about:debugging` → **This Firefox**, find **Job App Clipboard Kit**, and click **Reload**. Click the toolbar icon on a webpage to inject the updated panel. If you change only saved values through the panel, no reload is needed.

## Edit profile data

For everyday changes, click the pencil beside a section heading, update that section's fields, and click **Save**. Pressing Enter also saves the active section; use Shift+Enter to insert a newline.

New installations start with an empty profile. Existing saved values are preserved, while newly added fields are merged into the saved profile the next time the panel opens. To start over, clear the extension's local storage.

## Import or export a profile

Click the settings button beside the close button to turn dark mode on or off, or to export the currently saved profile as a versioned JSON file. The appearance choice is saved locally and restored the next time the panel opens. Importing a Job App Clipboard Kit JSON file replaces the saved profile after confirmation, making it easy to move the same information to another Firefox installation. Profile files contain the personal information entered in the extension, so store and share them carefully.

## Why it asks for permissions

The extension needs permission to copy information when you click it, remember your profile between browser sessions, and show the floating panel on the page where you open it. It only gets temporary access to the current tab after you click the toolbar icon.

The robot's name is Samson.

## Self-hosted update distribution

Firefox identifies this extension as `job-app-clipboard-kit@extensions.local`. Keep that ID unchanged across releases: changing it creates a different extension and disconnects existing installations and their locally stored profiles.

The distribution is hosted from the `chuongCode/Job-App-Clipboard-Kit` repository. Its public GitHub Pages endpoints are:

```text
https://chuongcode.github.io/Job-App-Clipboard-Kit/updates.json
https://chuongcode.github.io/Job-App-Clipboard-Kit/releases/job-app-clipboard-kit-<version>.xpi
```

GitHub Pages publishes `distribution/` as the site root, so `/distribution` does not appear in those public URLs. If a different static host is used, upload the contents of `distribution/`, preserve the `releases/` path, require HTTPS, and make the two URLs match that host's public layout.

### Enable GitHub Pages

1. Push the repository to GitHub and confirm that the release branch is named `main`. If it uses another name, change the branch under `on.push.branches` in `.github/workflows/deploy-distribution-pages.yml`.
2. In the GitHub repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Confirm that the URLs in `extension/manifest.json` and `distribution/updates.json` use `https://chuongcode.github.io/Job-App-Clipboard-Kit/`.
5. Push to `main`. The **Deploy extension distribution to GitHub Pages** workflow uploads only `distribution/` and publishes it over HTTPS.
6. Verify that the public `updates.json` and its XPI link load successfully before distributing the extension.

### Publish a release

1. Choose a new version number greater than the currently published one and set `version` in `extension/manifest.json` to that exact value.
2. Create the submission archive from the contents of `extension/` only. For example, from that directory run `zip -r ../job-app-clipboard-kit-<version>.zip .`.
3. Submit the archive to Mozilla Add-ons using the existing extension listing/ID and obtain the Mozilla-signed `.xpi`. Do not publish an unsigned locally built XPI: standard Firefox installations require Mozilla's signature.
4. Rename the signed file consistently, for example `job-app-clipboard-kit-<version>.xpi`, and place it in `distribution/releases/`.
5. In `distribution/updates.json`, set the advertised `version` to the same value and set `update_link` to the final HTTPS URL of that signed XPI. The key under `addons` must continue to exactly match the manifest's Firefox ID.
6. Commit the extension version change, signed XPI, and update-manifest change together, then push them. Wait for the static-host deployment to finish.
7. Check the live JSON and XPI URLs. An existing installation will then be able to discover the newer version through the manifest's `update_url`.

Only advertise a release after Mozilla has signed it and its public HTTPS download is available. `updates.json` represents the version currently offered to installed clients; older signed XPIs may remain in `distribution/releases/` for rollback or audit purposes.
