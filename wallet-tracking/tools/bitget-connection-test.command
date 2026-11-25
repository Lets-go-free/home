#!/bin/bash
cd -- "$(dirname -- "$0")" || exit 1
if ! command -v python3 >/dev/null 2>&1; then echo 'Python 3 fehlt.'; exit 1; fi
python3 bitget_connection_test.py
result=$?
read -r -p 'Enter zum Schliessen ...' unused
exit "$result"
