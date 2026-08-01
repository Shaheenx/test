#!/usr/bin/env bash
# download_west_fares.sh
# Downloads all 19 Western Zone fare files from official Bangladesh Railway
# Oracle Cloud storage. Run this on your machine (not inside the Claude sandbox).
#
# USAGE:  bash download_west_fares.sh
# OUTPUT: ./west_fare_files/*.xls  ./west_fare_files/*.xlsx  ./west_fare_files/*.pdf

BASE="https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-railway/2024/12"
OUT="./west_fare_files"
mkdir -p "$OUT"

download() {
  local hash="$1"
  local ext="$2"
  local label="$3"
  local dest="$OUT/${hash}.${ext}"
  printf "  %-65s  " "$label"
  curl -sL --max-time 30 "$BASE/${hash}.${ext}" -o "$dest"
  local size=$(stat -c%s "$dest" 2>/dev/null || stat -f%z "$dest" 2>/dev/null)
  if [ "$size" -gt 1000 ] 2>/dev/null; then
    echo "✓ ${size} bytes"
  else
    echo "✗ failed (${size} bytes) — check connection"
    rm -f "$dest"
  fi
}

echo ""
echo "Downloading Bangladesh Railway West Zone fare files..."
echo "Source: https://railway.gov.bd/pages/files/6919975d933eb65569ddc526"
echo "(Page last updated: 29 July 2026)"
echo ""

# ── XLS files (old format but directly parseable) ──────────────────────────
download "4afcbcddb62548ce98ab94b28ea1d12e" "xls"  "753/754 Silk City + 760/759 Padma + 770/769 Dhumketu"
download "fcb8666eb2f94e91b6f0b68c1a6da571" "xls"  "725/726 Sundarban + 763/764 Chitra  [LEGACY ROUTE]"
download "0d13da132baf484bb0296857a4a0e5e4" "xls"  "751/752 Lalmoni + 771/772 Rangpur Express"
download "7755d11b7ac84d1099e50c73a7aeefc5" "xls"  "765/766 Nilsagar"
download "9972ef6ba0b94f49aad459d452cb1ec2" "xls"  "705/706 Ekota + 757/758 Drutayan"
download "00fdc37d15214be7b70b5810850e1260" "xls"  "731/732 Barendra + 733/734 Titumir"
download "bb92c5f9838c4b59879ababb7df0b5b1" "xls"  "727/728 Rupsha + 747/748 Sima"
download "f570d10b6d454caab2346b4ea26af146" "xls"  "756/755 Madhumati + 779/780 Kalukhali"
download "d743f355ae2e4749ad6dc01a4938e9eb" "xls"  "713/714 Korotoa"
download "072305437d3c4e8e847bcfd1a41588bd" "xls"  "716/715 Kapotakkha + 762/761 Sagardari"
download "86cca8a03c06450a99da95e7b3270354" "xls"  "767/768 Dolonchapa"
download "c72a3b9790d848d5a7e598ab5742b4a5" "xls"  "Rangpur Commuter 1 & 2"
download "340e20c75f1340b9aa0b7bea106a9725" "xls"  "53/54 + 95/96 Commuter"
download "af1eb84a12bb4a75a9933789c4c92cef" "xls"  "57/58 + 77/78 Rajshahi Commuter"
download "6d9a7e55a0c644a59f325b935e4bd820" "xls"  "61/61 Dinajpur Commuter"

# ── XLSX file (newer, VAT included) ─────────────────────────────────────────
download "48fdc75598424bcf94764929defe7fc7" "xlsx" "791/792 Bonolata  [VAT INCLUDED]"

# ── PDF files (Vrinda font — need rasterize + pdfplumber, skip parser) ──────
echo ""
echo "Downloading PDF files (for manual processing — these have Vrinda font issue):"
download "c3f98ea76ae74f2c8afbfdd9e1b314ac" "pdf"  "803/804 Bangla Bandha (VAT excl)"
download "9dfacd8428da45038eff003139867091" "pdf"  "825/826 Jahanabad (VAT excl)"
download "ff3f62702121434a9961d678a59a76b2" "pdf"  "826/827 Ruposhi Bangla (VAT excl) ← PADMA BRIDGE ROUTE"

echo ""
echo "Done. Files saved to: $OUT/"
echo ""
echo "Next steps:"
echo "  1. Copy parse_west_fares.py and stations.json into this directory"
echo "  2. Run: python3 parse_west_fares.py --dir ./west_fare_files --out fares_west.json"
echo "  3. Merge: python3 parse_west_fares.py --dir ./west_fare_files --merge fares_fixed.json"
echo ""
echo "  For the 3 PDF files (803, 825, 826 trains):"
echo "    - Rasterize pages (150dpi minimum) and run pdfplumber with cell geometry"
echo "    - Same process used for the Eastern Zone fare PDF"
