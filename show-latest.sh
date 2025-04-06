#!/usr/bin/env bash

set -euo pipefail

d=$(ls -td runs/* | head -1) || true
f=$(ls -t "$d"/* | head -1) || true
echo "$f"
./show-periods.js "$f"
