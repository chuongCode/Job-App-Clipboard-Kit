# Job App Clipboard Kit

Job App Clipboard Kit is a lightweight, local-only browser extension that keeps frequently used job application details within easy reach. Inspired by the functionality of Simplify Copilot's clipboard feature.

Click the toolbar icon to toggle a floating profile panel in the current webpage, then click any value to copy only that value. The panel remains open while you interact with the page. Use a section's pencil to update its values; **Save** stores them in Firefox's local extension storage so they remain available after the panel or browser closes.

The extension has no backend, analytics, external requests, or third-party dependencies. Its small content script only creates and toggles the floating panel; it does not inspect forms or page data.

## Load temporarily in Firefox

1. Open `about:debugging` in Firefox.
2. Select **This Firefox**.
3. Click **Load Temporary Add-on**.
4. Select the repository root's `manifest.json` file.
5. Pin **Job App Clipboard Kit** to the toolbar if you want it to remain visible.
6. Open a normal webpage and click the toolbar icon to show or hide the floating panel. The X also closes it.

Temporary extensions are removed when Firefox exits.

The panel can be injected into regular `http`, `https`, and permitted `file` pages. Firefox blocks extensions from injecting into internal pages such as `about:debugging`, the built-in PDF viewer, and other protected browser pages. Navigating or reloading the tab removes the panel; click the toolbar icon to inject it again.

## Reload changes during development

After changing a source file, return to `about:debugging` → **This Firefox**, find **Job App Clipboard Kit**, and click **Reload**. Click the toolbar icon on a webpage to inject the updated panel. If you change only saved values through the panel, no reload is needed.

## Edit profile data

For everyday changes, click the pencil beside a section heading, update that section's fields, and click **Save**. Pressing Enter also saves the active section; use Shift+Enter to insert a newline.

New installations start with an empty profile. Existing saved values are preserved, while newly added fields are merged into the saved profile the next time the panel opens. To start over, clear the extension's local storage.

## Why it asks for permissions

The extension needs permission to copy information when you click it, remember your profile between browser sessions, and show the floating panel on the page where you open it. It only gets temporary access to the current tab after you click the toolbar icon.

The robot's name is Samson.
