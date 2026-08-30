# Job App Clipboard Kit

Job App Clipboard Kit is a lightweight, local-only browser extension that keeps frequently used job application details within easy reach. Inspired by the functionality of Simplify Copilot's clipboard feature but tired of how it terribly slows down opening new tabs (and its awful new layout).

Visit the [Job App Clipboard Kit website](https://chuongcode.github.io/Job-App-Clipboard-Kit/) for a visual look.

Click the toolbar icon to toggle a floating profile panel in the current webpage, then click any value to copy only that value. The panel remains open while you interact with the page. Use a section's pencil to update its values; **Save** stores them in Firefox's local extension storage so they remain available after the panel or browser closes.

The extension has no backend, analytics, external requests, or third-party dependencies. Its small content script only creates and toggles the floating panel; it does not inspect forms or page data.

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

Personal Location is edited as separate City and State fields and displayed as `City, State`. Click City to copy it by itself, click the rest of the Location row to copy `City, State`, or click the Location label to copy the combined `[Address], [City], [State] [ZIP]` value.

While editing Experience or Education, drag the six-dot handle beside an entry heading to rearrange the entries. The saved profile keeps that order.

New installations start with an empty profile. Existing saved values are preserved, while newly added fields are merged into the saved profile the next time the panel opens. To start over, clear the extension's local storage.

## Import or export a profile

Click the settings button beside the close button to turn dark mode on or off, or to export the currently saved profile as a versioned JSON file. The appearance choice is saved locally and restored the next time the panel opens. Importing a Job App Clipboard Kit JSON file replaces the saved profile after confirmation, making it easy to move the same information to another Firefox installation. Profile files contain the personal information entered in the extension, so store and share them carefully.

## Why it asks for permissions

The extension needs permission to copy information when you click it, remember your profile between browser sessions, and show the floating panel on the page where you open it. It only gets temporary access to the current tab after you click the toolbar icon.

The robot's name is Samson.
