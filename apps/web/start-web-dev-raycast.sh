#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Start Web Dev
# @raycast.mode silent
# @raycast.packageName LearnJapanese
# @raycast.description Open Terminal and run npm run dev for apps/web

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
open -a Terminal "$SCRIPT_DIR/start-web-dev.command"
