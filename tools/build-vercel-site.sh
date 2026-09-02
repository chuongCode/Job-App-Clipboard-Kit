#!/bin/sh

set -eu

output_dir=".vercel-static"

rm -rf "$output_dir"
mkdir -p "$output_dir"
cp -R website/. "$output_dir/"
cp distribution/updates.json "$output_dir/updates.json"
cp -R distribution/releases "$output_dir/releases"
rm -f "$output_dir/releases/.gitkeep"

test -f "$output_dir/index.html"
test -f "$output_dir/updates.json"
