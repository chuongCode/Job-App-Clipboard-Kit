# Job App Info

Job App Info is a small, local-only Firefox extension for copying frequently used job application details. Open the toolbar popup and click any value to copy only that value. Use **Edit** to update the values in place; **Save** stores them in Firefox's local extension storage so they remain available after the popup or browser closes.

The extension has no backend, analytics, external requests, content scripts, or third-party dependencies.

## File structure

```text
job-app-info/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── icons/
│   ├── icon-48.png
│   └── icon-96.png
└── README.md
```

## Load temporarily in Firefox

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select this folder's `manifest.json` file.
5. Pin **Job App Info** to the toolbar if you want it to remain visible.

Temporary extensions are removed when Firefox exits.

## Reload changes during development

After changing a source file, return to `about:debugging` → **This Firefox**, find **Job App Info**, and click **Reload**. Close and reopen the popup to see the update. If you change only saved values through the popup, no reload is needed.

## Edit profile data

For everyday changes, click **Edit** in the popup, update the fields, and click **Save**. The saved profile is kept locally by `browser.storage.local`.

The initial demo profile is the clearly marked `DEFAULT_PROFILE` object near the top of `popup.js`. Edit that object to change the defaults used by a fresh installation. Existing saved data is intentionally not overwritten by later changes to the default object. To test new defaults after data has already been saved, remove and reload the temporary extension or clear its extension storage.

## Permissions

- `clipboardWrite` allows a clicked value to be written to the clipboard.
- `storage` allows edited profile data to persist locally.

## Permanent installation

Standard Firefox installations generally require extensions to be signed by Mozilla for permanent installation. Mozilla's unlisted/self-distributed signing option can be used when you do not want to publish the extension publicly.
