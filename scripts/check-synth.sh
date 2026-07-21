#!/usr/bin/env bash
# Phase 10 kill-switch: fail if synth/demo strings sneak into gated dirs.
# Legitimate crypto/jitter uses are annotated with `// synth-ok:` on the same line.
set -e
DIRS=(
  src/components/analytics
  src/components/create
  src/components/engage
  src/components/library
  src/components/activity
  src/components/settings
)
PATTERN='Math\.random\('
STRINGS='(Demo data|Sample call|Product launch teaser|Behind the scenes reel|Old sale caption)'

fail=0
for d in "${DIRS[@]}"; do
  # Math.random without an inline synth-ok escape hatch
  if rg -n "$PATTERN" "$d" 2>/dev/null | rg -v "synth-ok" | rg . ; then
    echo "❌ Math.random found in $d (add // synth-ok: <reason> if legitimate)"
    fail=1
  fi
  if rg -n "$STRINGS" "$d" 2>/dev/null | rg . ; then
    echo "❌ Hard-coded synth string found in $d"
    fail=1
  fi
done
exit $fail
