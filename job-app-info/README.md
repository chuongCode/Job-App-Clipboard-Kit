# Job App Info

Job App Info is a small, local-only Firefox extension for copying frequently used job application details. Click the toolbar icon to toggle a floating profile panel in the current webpage, then click any value to copy only that value. The panel remains open while you interact with the page. Use a section's pencil to update its values; **Save** stores them in Firefox's local extension storage so they remain available after the panel or browser closes.

The extension has no backend, analytics, external requests, or third-party dependencies. Its small content script only creates and toggles the floating panel; it does not inspect forms or page data.

## File structure

```text
job-app-info/
├── manifest.json
├── background.js
├── content-panel.js
├── content-panel.css
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
6. Open a normal webpage and click the toolbar icon to show or hide the floating panel. The X also closes it.

Temporary extensions are removed when Firefox exits.

The panel can be injected into regular `http`, `https`, and permitted `file` pages. Firefox blocks extensions from injecting into internal pages such as `about:debugging`, the built-in PDF viewer, and other protected browser pages. Navigating or reloading the tab removes the panel; click the toolbar icon to inject it again.

## Reload changes during development

After changing a source file, return to `about:debugging` → **This Firefox**, find **Job App Info**, and click **Reload**. Click the toolbar icon on a webpage to inject the updated panel. If you change only saved values through the panel, no reload is needed.

## Edit profile data

For everyday changes, click the pencil beside a section heading, update that section's fields, and click **Save**. Pressing Enter also saves the active section; use Shift+Enter to insert a newline. In Personal, click the Location label to copy the combined `[Address], [Location] [ZIP]` value. Use **Add +** to add another Experience position or an **Additional** link. The minus beside an Additional link removes it when the section is saved. Experience positions are sorted by their latest end date when loaded or saved; `Present`, `Current`, and `Now` are treated as ongoing positions and appear first. ISO-style dates such as `2025-06` are recommended. The saved profile is kept locally by `browser.storage.local`.

The initial demo profile is the clearly marked `DEFAULT_PROFILE` object near the top of `popup.js`. Edit that object to change the defaults. Existing saved values are preserved, while newly added fields are merged into the saved profile the next time the popup opens. To replace an existing saved value with its updated default, edit it in the popup or clear the extension's local storage.

## Permissions

- `clipboardWrite` allows a clicked value to be written to the clipboard.
- `storage` allows edited profile data to persist locally.
- `activeTab` grants temporary access only to the tab where you click the toolbar icon.
- `scripting` injects the floating panel into that active tab.

## Permanent installation

Standard Firefox installations generally require extensions to be signed by Mozilla for permanent installation. Mozilla's unlisted/self-distributed signing option can be used when you do not want to publish the extension publicly.
