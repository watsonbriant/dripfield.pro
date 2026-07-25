#!/usr/bin/env sh
# Wednesday cutover: activate host redirects, then deploy dripfield.pro.
set -eu
cd "$(dirname "$0")/.."
cp public/_redirects.go-live public/_redirects
echo "Updated public/_redirects from public/_redirects.go-live"
echo "Next: deploy dripfield.pro (and confirm wtedradio.com popup is live)."
