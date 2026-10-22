#!/usr/bin/env bash
# Preflight for the personal iOS build. Verifies that all signing secrets are
# present and that the bundle id is identical in capacitor.config.ts, the Xcode
# project and the provisioning profile. macOS only (security + PlistBuddy).
#
# Usage: ios-secrets-check.sh <decoded.mobileprovision>
set -Eeuo pipefail

fail() { printf '::error::%s\n' "$*" >&2; exit 1; }
info() { printf '%s\n' "$*"; }

required_secrets=(IOS_P12_BASE64 IOS_P12_PASSWORD IOS_PROVISION_BASE64 KEYCHAIN_PASSWORD)
missing=()
for name in "${required_secrets[@]}"; do
  [[ -n "${!name:-}" ]] || missing+=("$name")
done
if (( ${#missing[@]} > 0 )); then
  fail "Missing required secrets: ${missing[*]}. Add them in Settings -> Secrets and variables -> Actions."
fi

[[ "$(uname -s)" == "Darwin" ]] || fail "This check must run on macOS: it reads the profile with 'security' and PlistBuddy."
command -v security >/dev/null 2>&1 || fail "'security' not found in PATH"
[[ -x /usr/libexec/PlistBuddy ]] || fail "PlistBuddy not found at /usr/libexec/PlistBuddy"

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
config_file="$repo_root/capacitor.config.ts"
project_file="$repo_root/ios/App/App.xcodeproj/project.pbxproj"
profile_file="${1:-}"

[[ -f "$config_file" ]] || fail "capacitor.config.ts not found at $config_file"
[[ -f "$project_file" ]] || fail "ios/App/App.xcodeproj/project.pbxproj not found; run 'pnpm ios:add'"
if [[ -z "$profile_file" || ! -f "$profile_file" ]]; then
  fail "Usage: $0 <decoded.mobileprovision> (the CI job decodes IOS_PROVISION_BASE64 first)"
fi

config_app_id="$(sed -nE 's/^[[:space:]]*appId:[[:space:]]*"([^"]+)".*/\1/p' "$config_file" | head -n1)"
[[ -n "$config_app_id" ]] || fail "Could not read appId from capacitor.config.ts"

project_app_ids="$(sed -nE 's/^[[:space:]]*PRODUCT_BUNDLE_IDENTIFIER = "?([^";]+)"?;.*/\1/p' "$project_file" | sort -u)"
[[ -n "$project_app_ids" ]] || fail "PRODUCT_BUNDLE_IDENTIFIER not found in project.pbxproj"
project_app_id_count="$(printf '%s\n' "$project_app_ids" | wc -l | tr -d '[:space:]')"
if [[ "$project_app_id_count" != "1" ]]; then
  fail "PRODUCT_BUNDLE_IDENTIFIER differs between build configurations: $(printf '%s ' $project_app_ids)"
fi
project_app_id="$project_app_ids"

profile_plist="$(mktemp -t liner-profile).plist"
trap 'rm -f "$profile_plist"' EXIT
security cms -D -i "$profile_file" > "$profile_plist" 2>/dev/null || fail "Could not decode the provisioning profile. Is IOS_PROVISION_BASE64 a .mobileprovision file?"
profile_app_id="$(/usr/libexec/PlistBuddy -c 'Print :Entitlements:application-identifier' "$profile_plist" 2>/dev/null || true)"
[[ -n "$profile_app_id" ]] || fail "Provisioning profile has no Entitlements:application-identifier"
team_id="$(/usr/libexec/PlistBuddy -c 'Print :TeamIdentifier:0' "$profile_plist" 2>/dev/null || true)"
profile_bundle_id="${profile_app_id#*.}"

profile_matches_app=false
if [[ "$profile_bundle_id" == *'*' ]]; then
  prefix="${profile_bundle_id%\*}"
  if [[ "$config_app_id" == "$prefix"* ]]; then
    profile_matches_app=true
  fi
elif [[ "$config_app_id" == "$profile_bundle_id" ]]; then
  profile_matches_app=true
fi

info "appId (capacitor.config.ts):      $config_app_id"
info "bundle id (Xcode project):        $project_app_id"
info "bundle id (provisioning profile): $profile_bundle_id${team_id:+ (team $team_id)}"

if [[ "$project_app_id" != "$config_app_id" ]]; then
  fail "Bundle id mismatch: capacitor.config.ts has '$config_app_id' but the Xcode project has '$project_app_id'."
fi
if [[ "$profile_matches_app" != true ]]; then
  fail "Bundle id mismatch: the profile is for '$profile_bundle_id' but the app uses '$config_app_id'."
fi

info "OK: signing secrets are present and all bundle ids match."
