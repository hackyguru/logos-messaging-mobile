#!/usr/bin/env bash
# Downloads the prebuilt native libraries (.a/.so) from the GitHub release and
# restores them into native/logosdelivery/.
#
# The archives are stored as 8 MB parts so that a dropped connection only costs
# one part rather than the whole download; curl resumes and retries per part.
set -euo pipefail

BASE="https://github.com/hackyguru/logos-messaging-mobile/releases/download/native-libs-v1"
IOS_PARTS=(aa ab ac ad ae)
ANDROID_PARTS=(aa ab ac ad ae af)
IOS_SHA256="78ed59dea64883514858395e3fa27135ae812ca16fd0a891dbc1ac28920cb41a"
ANDROID_SHA256="6e41971ceac237ebcfad390befd1031d0d6a748441d82a12069ab482dd1828aa"

cd "$(dirname "$0")/.."
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

fetch_archive() { # $1=name  $2=expected sha256  $3...=part suffixes
  local name=$1 want=$2; shift 2
  local out="$work/$name.tar.gz"
  : > "$out"
  for suffix in "$@"; do
    local part="part-$name-$suffix"
    echo "  $part"
    curl -fL -# --retry 8 --retry-all-errors --retry-delay 5 -C - \
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

echo "Native libraries restored under native/logosdelivery/."
