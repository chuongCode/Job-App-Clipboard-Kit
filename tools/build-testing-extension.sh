#!/bin/sh
set -eu

repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
source_dir="$repo_dir/extension"
local_dir="$repo_dir/.local"
build_dir="$local_dir/testing-extension"
master_icon="$local_dir/testing-robot-master.png"

if [ ! -f "$master_icon" ]; then
  echo "Missing local testing icon: $master_icon" >&2
  exit 1
fi

mkdir -p "$local_dir"
rm -rf "$build_dir"
cp -R "$source_dir" "$build_dir"

for size in 16 32 48 96; do
  sips -z "$size" "$size" "$master_icon" \
    --out "$build_dir/icons/robot-v4-$size.png" >/dev/null
done

MANIFEST_PATH="$build_dir/manifest.json" node <<'NODE'
const fs = require("fs");
const path = process.env.MANIFEST_PATH;
const manifest = JSON.parse(fs.readFileSync(path, "utf8"));

manifest.name += " (Testing)";
manifest.action.default_title += " (Testing)";
manifest.browser_specific_settings.gecko.id =
  "job-app-clipboard-kit-testing@extensions.local";
delete manifest.browser_specific_settings.gecko.update_url;

fs.writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
NODE

echo "Testing extension built at: $build_dir"
