#!/usr/bin/env bash
# Checks that building Api writes the OpenAPI document to Api/openapi.json.
set -euo pipefail

cd "$(dirname "$0")/.."
doc=Api/openapi.json

rm -f "$doc"
dotnet build Api --nologo -v quiet >/dev/null

fail() { echo "FAIL: $1" >&2; exit 1; }

[ -f "$doc" ] || fail "$doc was not written by the build"
jq -e '.openapi | startswith("3.")' "$doc" >/dev/null || fail "not an OpenAPI 3 document"

jq -e '.paths["/api/health"].get' "$doc" >/dev/null || fail "no GET /api/health"

schema=$(jq -c '.paths["/api/Weather"].get.responses["200"].content["application/json"].schema' "$doc")
[ "$schema" != "null" ] || fail "no 200 application/json response on GET /api/Weather"
items=$(jq -c --argjson s "$schema" -n '$s.items' )
[ "$(jq -r --argjson s "$schema" -n '$s.type')" = "array" ] || fail "GET /api/Weather 200 is not an array"
if ref=$(jq -r --argjson i "$items" -n '$i["$ref"] // empty'); [ -n "$ref" ]; then
  items=$(jq -c --arg name "${ref##*/}" '.components.schemas[$name]' "$doc")
fi
for prop in date temperatureC summary; do
  jq -e --argjson i "$items" --arg p "$prop" -n '$i.properties | has($p)' >/dev/null \
    || fail "forecast schema has no '$prop' property"
done

echo "PASS: $doc describes GET /api/Weather and GET /api/health"
