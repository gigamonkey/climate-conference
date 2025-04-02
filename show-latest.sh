#!/usr/bin/env bash

set -euo pipefail

f=$(ls -t runs/*/* | head -1) || true
echo "$f"
./show-deltas.js "$f"
