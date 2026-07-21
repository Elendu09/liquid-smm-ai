#!/usr/bin/env bash
# Phase 10 kill-switch: fail if synth/demo strings sneak into gated dirs.
# Legitimate crypto/jitter uses must have `synth-ok:` on the same or previous line.
set -e
DIRS=(
  src/components/analytics
  src/components/create
  src/components/engage
  src/components/library
  src/components/activity
  src/components/settings
)
FILES=(
  src/pages/dashboard/Reports.tsx
)
STRINGS='(Product launch teaser|Behind the scenes reel|Old sale caption|Auto-reply to @jordan\.creates|\bconst TITLES = \[)'

fail=0
scan_random() {
  local target="$1"
  while IFS=: read -r file line _; do
    [ -z "$file" ] && continue
    cur=$(sed -n "${line}p" "$file")
    prev=$(sed -n "$((line-1))p" "$file")
    if ! echo "$cur$prev" | grep -q "synth-ok"; then
      echo "❌ Math.random in $file:$line (add // eslint-disable-next-line no-restricted-syntax -- synth-ok: <reason>)"
      fail=1
    fi
  done < <(rg -n 'Math\.random\(' "$target" 2>/dev/null || true)

  if rg -n "$STRINGS" "$target" 2>/dev/null | rg . ; then
    echo "❌ Hard-coded synth string found in $target"
    fail=1
  fi
}

for d in "${DIRS[@]}"; do scan_random "$d"; done
for f in "${FILES[@]}"; do [ -f "$f" ] && scan_random "$f"; done
exit $fail
