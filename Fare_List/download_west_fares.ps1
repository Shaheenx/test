# download_west_fares.ps1
# Downloads all 19 Western Zone fare files from official Bangladesh Railway storage.
#
# USAGE (run in PowerShell):
#   .\download_west_fares.ps1
#
# If you get a security error, run this first:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

$BASE = "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-railway/2024/12"
$OUT  = ".\west_fare_files"

New-Item -ItemType Directory -Force -Path $OUT | Out-Null

function Get-FareFile {
    param (
        [string]$Hash,
        [string]$Ext,
        [string]$Label
    )
    $url  = "$BASE/$Hash.$Ext"
    $dest = "$OUT\$Hash.$Ext"
    Write-Host "  $Label" -NoNewline
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $size = (Get-Item $dest).Length
        if ($size -gt 1000) {
            Write-Host "  ✓ $([math]::Round($size/1024, 1)) KB" -ForegroundColor Green
        } else {
            Write-Host "  ✗ too small ($size bytes) — may have failed" -ForegroundColor Red
            Remove-Item $dest -Force
        }
    } catch {
        Write-Host "  ✗ ERROR: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Bangladesh Railway — West Zone Fare Files" -ForegroundColor Cyan
Write-Host "Source: https://railway.gov.bd/pages/files/6919975d933eb65569ddc526"
Write-Host "(Page last updated: 29 July 2026)"
Write-Host ""
Write-Host "── XLS files (directly parseable) ──────────────────────────────" -ForegroundColor Yellow

Get-FareFile "4afcbcddb62548ce98ab94b28ea1d12e" "xls"  "753/754 Silk City + 760/759 Padma + 770/769 Dhumketu"
Get-FareFile "fcb8666eb2f94e91b6f0b68c1a6da571" "xls"  "725/726 Sundarban + 763/764 Chitra  [LEGACY ROUTE]"
Get-FareFile "0d13da132baf484bb0296857a4a0e5e4" "xls"  "751/752 Lalmoni + 771/772 Rangpur Express"
Get-FareFile "7755d11b7ac84d1099e50c73a7aeefc5" "xls"  "765/766 Nilsagar"
Get-FareFile "9972ef6ba0b94f49aad459d452cb1ec2" "xls"  "705/706 Ekota + 757/758 Drutayan"
Get-FareFile "00fdc37d15214be7b70b5810850e1260" "xls"  "731/732 Barendra + 733/734 Titumir"
Get-FareFile "bb92c5f9838c4b59879ababb7df0b5b1" "xls"  "727/728 Rupsha + 747/748 Sima"
Get-FareFile "f570d10b6d454caab2346b4ea26af146" "xls"  "756/755 Madhumati + 779/780 Kalukhali"
Get-FareFile "d743f355ae2e4749ad6dc01a4938e9eb" "xls"  "713/714 Korotoa"
Get-FareFile "072305437d3c4e8e847bcfd1a41588bd" "xls"  "716/715 Kapotakkha + 762/761 Sagardari"
Get-FareFile "86cca8a03c06450a99da95e7b3270354" "xls"  "767/768 Dolonchapa"
Get-FareFile "c72a3b9790d848d5a7e598ab5742b4a5" "xls"  "Rangpur Commuter 1 & 2"
Get-FareFile "340e20c75f1340b9aa0b7bea106a9725" "xls"  "53/54 + 95/96 Commuter"
Get-FareFile "af1eb84a12bb4a75a9933789c4c92cef" "xls"  "57/58 + 77/78 Rajshahi Commuter"
Get-FareFile "6d9a7e55a0c644a59f325b935e4bd820" "xls"  "61/61 Dinajpur Commuter"

Write-Host ""
Write-Host "── XLSX file (VAT included) ─────────────────────────────────────" -ForegroundColor Yellow
Get-FareFile "48fdc75598424bcf94764929defe7fc7" "xlsx" "791/792 Bonolata  [VAT INCLUDED]"

Write-Host ""
Write-Host "── PDF files (Vrinda font — process separately with pdfplumber) ──" -ForegroundColor Yellow
Get-FareFile "c3f98ea76ae74f2c8afbfdd9e1b314ac" "pdf"  "803/804 Bangla Bandha"
Get-FareFile "9dfacd8428da45038eff003139867091" "pdf"  "825/826 Jahanabad"
Get-FareFile "ff3f62702121434a9961d678a59a76b2" "pdf"  "826/827 Ruposhi Bangla  [PADMA BRIDGE ROUTE]"

Write-Host ""
Write-Host "Done. Files saved to: $OUT" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Copy parse_west_fares.py and stations.json into this folder"
Write-Host "  2. Run:   python parse_west_fares.py --dir .\west_fare_files --out fares_west.json"
Write-Host "  3. Merge: python parse_west_fares.py --dir .\west_fare_files --merge fares_fixed.json"
