#!/usr/bin/env bash
# Downloads the prebuilt native libraries (.a/.so) from the GitHub release and
# restores them into native/logosdelivery/.
#
# Runs automatically via `npm install` (postinstall). It is a no-op when the
# libraries are already present, so repeat installs cost nothing. Pass --force
# to re-download regardless.
#
# The archives are stored as 8 MB parts because the release was uploaded over a
# slow link and GitHub's asset upload cannot resume; the parts are concatenated
# and checksum-verified here.
set -euo pipefail

BASE="https://github.com/hackyguru/logos-messaging-mobile/releases/download/native-libs-v1"
IOS_PARTS=(aa ab ac ad ae)
ANDROID_PARTS=(aa ab ac ad ae af)
IOS_SHA256="78ed59dea64883514858395e3fa27135ae812ca16fd0a891dbc1ac28920cb41a"
ANDROID_SHA256="6e41971ceac237ebcfad390befd1031d0d6a748441d82a12069ab482dd1828aa"

# The files withLogosDelivery.js and LogosMessaging.podspec actually consume.
REQUIRED=(
  native/logosdelivery/arm64-v8a/libc++_shared.so
  native/logosdelivery/arm64-v8a/librln.so
  native/logosdelivery/arm64-v8a/liblogosdelivery.so
  native/logosdelivery/arm64-v8a/liblogos_messaging_jni.so
  native/logosdelivery/ios/liblogosdelivery.a
  native/logosdelivery/ios/librln.a
)

cd "$(dirname "$0")/.."

if [ "${1:-}" != "--force" ]; then
  missing=0
  for f in "${REQUIRED[@]}"; do
    [ -s "$f" ] || missing=1
  done
  if [ "$missing" = 0 ]; then
    echo "Native libraries already present — skipping download (use --force to refetch)."
    exit 0
  fi
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

# Progress bar interactively; quiet under `npm install` and CI.
if [ -t 1 ]; then progress="-#"; else progress="-s"; fi

fetch_archive() { # $1=name  $2=expected sha256  $3...=part suffixes
  local name=$1 want=$2; shift 2
  local out="$work/$name.tar.gz"
  : > "$out"
  for suffix in "$@"; do
    local part="part-$name-$suffix"
    echo "  $part"
    curl -fL $progress --retry 8 --retry-all-errors --retry-delay 5 -C - \
      -o "$work/$part" "$BASE/$part"
    cat "$work/$part" >> "$out"
  done

  local got
  got=$(shasum -a 256 "$out" | cut -d' ' -f1)
  if [ "$got" != "$want" ]; then
    echo "error: checksum mismatch for $name (got $got, want $want)" >&2
    exit 1
  fi
  tar xzf "$out"
}

echo "Fetching iOS libraries..."
fetch_archive ios "$IOS_SHA256" "${IOS_PARTS[@]}"
echo "Fetching Android libraries..."
fetch_archive android "$ANDROID_SHA256" "${ANDROID_PARTS[@]}"

for f in "${REQUIRED[@]}"; do
  if [ ! -s "$f" ]; then
    echo "error: $f still missing after download" >&2
    exit 1
  fi
done

echo "Native libraries restored under native/logosdelivery/."
