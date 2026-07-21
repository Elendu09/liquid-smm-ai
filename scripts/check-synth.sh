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
STRINGS='(Product launch teaser|Behind the scenes reel|Old sale caption|Auto-reply to @jordan\.creates)'

fail=0
for d in "${DIRS[@]}"; do
  while IFS=: read -r file line _; do
    [ -z "$file" ] && continue
    cur=$(sed -n "${line}p" "$file")
    prev=$(sed -n "$((line-1))p" "$file")
    if ! echo "$cur$prev" | grep -q "synth-ok"; then
      echo "❌ Math.random in $file:$line (add // eslint-disable-next-line no-restricted-syntax -- synth-ok: <reason>)"
      fail=1
    fi
  done < <(rg -n 'Math\.random\(' "$d" 2>/dev/null || true)

  if rg -n "$STRINGS" "$d" 2>/dev/null | rg . ; then
    echo "❌ Hard-coded synth string found in $d"
    fail=1
  fi
done
exit $fail
