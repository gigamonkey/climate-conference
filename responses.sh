#!/usr/bin/env bash

set -euo pipefail

RESPONSES="Climate Conference '25 Workshop Selection .csv.zip"

cp ~/Downloads/"$RESPONSES" data
cd data
unzip "$RESPONSES"
