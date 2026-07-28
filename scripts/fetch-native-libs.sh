#!/usr/bin/env bash
# Downloads the prebuilt native libraries (.a/.so) from the GitHub release
# and restores them into native/logosdelivery/. Run from anywhere.
set -euo pipefail

BASE="https://github.com/hackyguru/logos-messaging-mobile/releases/download/native-libs-v1"
ASSETS=(native-libs-ios.tar.gz native-libs-android.tar.gz)

cd "$(dirname "$0")/.."

for asset in "${ASSETS[@]}"; do
  echo "Downloading $asset ..."
  curl -fL --retry 5 --retry-all-errors "$BASE/$asset" | tar xz
done

echo "Native libraries restored under native/logosdelivery/."
