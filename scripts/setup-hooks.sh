#!/bin/sh
#
# Copy git hooks from git-hooks/ into .git/hooks/ and make them executable.
# Usage:
#   sh scripts/setup-hooks.sh all          # install all hooks
#   sh scripts/setup-hooks.sh pre-commit   # install a single hook

set -e

HOOKS_SRC="git-hooks"
HOOKS_DST=".git/hooks"

if [ ! -d "$HOOKS_SRC" ]; then
  echo "Error: $HOOKS_SRC directory not found" >&2
  exit 1
fi

install_hook() {
  local hook="$1"
  if [ ! -f "$HOOKS_SRC/$hook" ]; then
    echo "Error: $HOOKS_SRC/$hook not found" >&2
    return 1
  fi
  cp "$HOOKS_SRC/$hook" "$HOOKS_DST/$hook"
  chmod +x "$HOOKS_DST/$hook"
  echo "Installed $hook"
}

if [ "$1" = "all" ]; then
  for hook in "$HOOKS_SRC"/*; do
    install_hook "$(basename "$hook")"
  done
else
  for hook in "$@"; do
    install_hook "$hook"
  done
fi
