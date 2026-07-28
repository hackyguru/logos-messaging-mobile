#!/usr/bin/env bash
# Downloads the prebuilt native libraries (.a/.so) from the GitHub release
# and restores them into native/logosdelivery/. Run from anywhere.
set -euo pipefail

REPO="hackyguru/logos-messaging-mobile"
TAG="native-libs-v1"
ASSETS=(native-libs-ios.tar.gz native-libs-android.tar.gz)

command -v gh >/dev/null 2>&1 || {
  echo "error: GitHub CLI (gh) is required — https://cli.github.com" >&2
  exit 1
}

cd "$(dirname "$0")/.."

for asset in "${ASSETS[@]}"; do
  echo "Downloading $asset ..."
  gh release download "$TAG" --repo "$REPO" --pattern "$asset" --output - | tar xz
done

echo "Native libraries restored under native/logosdelivery/."
