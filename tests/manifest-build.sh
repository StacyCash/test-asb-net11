#!/usr/bin/env bash
# Builds and starts the api component with builder.yaml's own build and run.start
# commands, then probes run.healthCheckPath on run.port for HTTP 200.
# Usage: tests/manifest-build.sh [manifest]   (default: builder.yaml)
set -euo pipefail

repo=$(cd "$(dirname "$0")/.." && pwd)
manifest=$(realpath "${1:-$repo/builder.yaml}")
field() { node "$repo/tests/manifest-field.mjs" "$manifest" api "$1"; }

root=$(field rootDirectory)
build=$(field build)
start=$(field run.start)
port=$(field run.port)
health=$(field run.healthCheckPath)

export DESTINATION_DIR=$(mktemp -d)
trap '[ -n "${pid:-}" ] && kill "$pid" 2>/dev/null; rm -rf "$DESTINATION_DIR"' EXIT

(cd "$repo/$root" && bash -c "$build") >/dev/null
(cd "$DESTINATION_DIR" && exec bash -c "exec $start") >/dev/null 2>&1 &
pid=$!

url="http://127.0.0.1:$port$health"
for _ in $(seq 1 60); do
  status=$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)
  [ "$status" != "000" ] && break
  sleep 0.5
done

if [ "$status" = "200" ]; then
  echo "PASS: $url returned 200"
else
  echo "FAIL: $url returned $status" >&2
  exit 1
fi
