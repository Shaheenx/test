#!/usr/bin/env python3
"""
parse_west_fares.py
====================
Parses official Bangladesh Railway Western Zone fare files
(XLS, XLSX, or PDF) downloaded from railway.gov.bd and outputs
fares_west.json in the same schema as fares_fixed.json.

USAGE
-----
1. Download all files from the railway.gov.bd fare listing page:
   https://railway.gov.bd/pages/files/6919975d933eb65569ddc526

2. Place them in a directory (default: ./west_fare_files/)

3. Run:
   python3 parse_west_fares.py [--dir ./west_fare_files] [--out fares_west.json]

4. Merge fares_west.json into fares_fixed.json:
   python3 parse_west_fares.py --merge fares_fixed.json

WHAT THE SCRIPT DOES
--------------------
- Reads each XLS/XLSX file using xlrd/openpyxl (direct, no OCR)
- Auto-detects the table layout (flat or grouped)
- Matches Bengali station names to city labels via the station DB
- Deduplicates identical from/to/class combinations (keeps first occurrence)
- Outputs a report of: rows accepted, skipped (no station match), classes found
- Flags all rows with the correct source PDF date and honesty note

KNOWN LIMITATIONS
-----------------
- Sundarban (725/726) and Chitra (763/764) XLS files use the PRE-PADMA BRIDGE
  route (via Darshana-Bheramara-Ishwardi). Fares for Khulna↔Dhaka terminals
  are still valid; intermediate stops are flagged LEGACY_ROUTE.
- PDF-format files (803/804, 825/826, 826/827) have Vrinda font encoding issues
  and are NOT processed by this script. Download, rasterize, and use pdfplumber
  with cell geometry extraction (same process used for the Eastern Zone PDF).
- Bonolata (791/792) XLSX is processed. Its note field indicates VAT is included.

FILE → TRAIN MAPPING (from railway.gov.bd as of July 2026)
------------------------------------------------------------
4afcbcddb62548ce98ab94b28ea1d12e.xls  → 753/754 Silk City + 760/759 Padma + 770/769 Dhumketu
fcb8666eb2f94e91b6f0b68c1a6da571.xls  → 725/726 Sundarban + 763/764 Chitra  [LEGACY ROUTE]
0d13da132baf484bb0296857a4a0e5e4.xls  → 751/752 Lalmoni + 771/772 Rangpur
7755d11b7ac84d1099e50c73a7aeefc5.xls  → 765/766 Nilsagar
9972ef6ba0b94f49aad459d452cb1ec2.xls  → 705/706 Ekota + 757/758 Drutayan
00fdc37d15214be7b70b5810850e1260.xls  → 731/732 Barendra + 733/734 Titumir
bb92c5f9838c4b59879ababb7df0b5b1.xls  → 727/728 Rupsha + 747/748 Sima
f570d10b6d454caab2346b4ea26af146.xls  → 756/755 Madhumati + 779/780 Kalukhali
d743f355ae2e4749ad6dc01a4938e9eb.xls  → 713/714 Korotoa
072305437d3c4e8e847bcfd1a41588bd.xls  → 716/715 Kapotakkha + 762/761 Sagardari
86cca8a03c06450a99da95e7b3270354.xls  → 767/768 Dolonchapa
c72a3b9790d848d5a7e598ab5742b4a5.xls  → Rangpur Commuter 1 & 2
340e20c75f1340b9aa0b7bea106a9725.xls  → 53/54 + 95/96 Commuter
af1eb84a12bb4a75a9933789c4c92cef.xls  → 57/58 + 77/78 Rajshahi Commuter
6d9a7e55a0c644a59f325b935e4bd820.xls  → 61/61 Dinajpur Commuter
48fdc75598424bcf94764929defe7fc7.xlsx → 791/792 Bonolata  [VAT INCLUDED]
c3f98ea76ae74f2c8afbfdd9e1b314ac.pdf  → 803/804 Bangla Bandha  [PDF — skip]
9dfacd8428da45038eff003139867091.pdf  → 825/826 Jahanabad     [PDF — skip]
ff3f62702121434a9961d678a59a76b2.pdf  → 826/827 Ruposhi Bangla [PDF — skip]
"""

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import xlrd
except ImportError:
    sys.exit("Missing: pip install xlrd")

try:
    import openpyxl
except ImportError:
    sys.exit("Missing: pip install openpyxl")


# ---------------------------------------------------------------------------
# SEAT CLASS MAPPING — Bengali header text → DB code
# ---------------------------------------------------------------------------
CLASS_MAP = {
    # Shovan variants
    "শোভন": "SHOVAN",
    "শোভন সাধারণ": "SHOVAN",
    "সুলভ": "SHULOV",
    # Shovan Chair
    "শোভন চেয়ার": "S_CHAIR",
    # Snigdha
    "স্নিগ্ধা": "SNIGDHA",
    # First Class Seat
    "১ম আসন": "F_SEAT",
    "১ম সিট": "F_SEAT",
    "প্রথম শ্রেণীর আসন": "F_SEAT",
    "প্রথম শ্রেণী আসন": "F_SEAT",
    "প্রথম শ্রেণী": "F_SEAT",
    # First Class Berth
    "১ম বার্থ": "F_BERTH",
    "প্রথম শ্রেণীর বার্থ": "F_BERTH",
    "প্রথম বার্থ": "F_BERTH",
    # AC Seat variants
    "তাপানুকূল আসন": "AC_S",
    "তাপানুকূল সিট": "AC_S",
    "এসি আসন": "AC_S",
    "এসি সিট": "AC_S",
    "এ.সি. আসন": "AC_S",
    # AC Berth variants
    "তাপানুকূল বার্থ": "AC_B",
    "এসি বার্থ": "AC_B",
    "এ.সি. বার্থ": "AC_B",
    # English fallbacks (some newer files mix English headers)
    "shovan": "SHOVAN",
    "shovan chair": "S_CHAIR",
    "snigdha": "SNIGDHA",
    "1st seat": "F_SEAT",
    "1st berth": "F_BERTH",
    "ac seat": "AC_S",
    "ac berth": "AC_B",
}

# Files known to use the legacy Khulna route (pre-Padma Bridge)
LEGACY_ROUTE_FILES = {
    "fcb8666eb2f94e91b6f0b68c1a6da571.xls",   # Sundarban + Chitra
}

# Files where fares include VAT
VAT_INCLUDED_FILES = {
    "48fdc75598424bcf94764929defe7fc7.xlsx",   # Bonolata
}


def load_station_lookup() -> dict[str, str]:
    """
    Tries to load stations.json from common locations,
    builds Bengali name → CITY_LABEL map.
    Falls back to a minimal hardcoded set if not found.
    """
    search_paths = [
        Path("stations.json"),
        Path("../stations.json"),
        Path("apk/data/stations.json"),
        Path(__file__).parent / "stations.json",
    ]
    for p in search_paths:
        if p.exists():
            with open(p) as f:
                data = json.load(f)
            stations = data.get("stations", data) if isinstance(data, dict) else data
            lookup: dict[str, str] = {}
            for s in stations:
                label = re.sub(r"\s*\(.*?\)", "", s["name_en"]).strip().upper()
                bn = re.sub(r"\s*\(.*?\)", "", s.get("name_bn", "")).strip()
                if bn:
                    lookup[bn] = label
                en_upper = s["name_en"].strip().upper()
                lookup[en_upper] = label
                lookup[label] = label
            print(f"  ✓ Loaded {len(stations)} stations from {p}")
            return lookup

    # Minimal hardcoded fallback for the most common Western Zone cities
    print("  ⚠ stations.json not found — using minimal fallback lookup")
    return {
        "ঢাকা": "DHAKA", "ঢাকা (কমলাপুর)": "DHAKA",
        "ঢাকা বিমানবন্দর": "DHAKA AIRPORT", "জয়দেবপুর": "JOYDEBPUR",
        "টাঙ্গাইল": "TANGAIL", "ইব্রাহিমাবাদ": "IBRAHIMABAD",
        "শহীদ এম এম আলী": "SM ALI", "উল্লাপাড়া": "ULLAPARA",
        "বড়ালশী ব্রিজ": "BARALSHI BRIDGE", "চাটমোহর": "CHATMOHAR",
        "ঈশ্বরদী বাইপাস": "ISHWARDI BYPASS", "ঈশ্বরদী": "ISHWARDI",
        "আলীপুর": "ALIPOUR", "সরদহ রোড": "SARDAH ROAD",
        "রাজশাহী": "RAJSHAHI", "আড়ানী": "ARANI",
        "নাটোর": "NATORE", "সান্তাহার": "SANTAHAR",
        "আহসানগঞ্জ": "AHSANGANJ", "জয়পুরহাট": "JOYPURHAT",
        "পাঁচবিবি": "PANCHIBABI", "বিরামপুর": "BIRAMPUR",
        "ফুলবাড়ী": "FULBARI", "পার্বতীপুর": "PARBATIPUR",
        "চিরিরবন্দর": "CHIRIRBANDAR", "দিনাজপুর": "DINAJPUR",
        "সেতাবগঞ্জ": "SETABGANJ", "পীরগঞ্জ": "PIRGANJ",
        "ঠাকুরগাঁও": "THAKURGAON", "রুহিয়া": "RUHIA",
        "কিসমত": "KISMAT", "পঞ্চগড়": "PANCHAGARH",
        "খুলনা": "KHULNA", "দৌলতপুর": "DAULTAPUR",
        "নোয়াপাড়া": "NOAPARA", "যশোর": "JESSORE",
        "কোটচাঁদপুর": "KOTCHANDPUR", "দর্শনা হল্ট": "DARSHANA HALT",
        "চুয়াডাঙ্গা": "CHUADANGA", "আলমডাঙ্গা": "ALAMDANGA",
        "পোড়াদহ": "PORADAHA", "মির্জাপুর": "MIRZAPUR",
        "ভেড়ামারা": "BHERAMARA", "মোবারকগঞ্জ": "MOBARAKGANJ",
        "বগুড়া": "BOGURA", "সোনাতলা": "SONATALA",
        "বোনারপাড়া": "BONARPARA", "গাইবান্ধা": "GAIBANDHA",
        "বামনডাঙ্গা": "BAMONDANGA", "পীরগাছা": "PIRGACHA",
        "কাউনিয়া": "KAUNIA", "তিস্তা": "TISTA",
        "রংপুর": "RANGPUR", "বদরগঞ্জ": "BADARGANJ",
        "মহিমাগঞ্জ": "MOHIMAGANJ", "লালমনিরহাট": "LALMONIRHAT",
        "আদিতমারী": "ADITMARI", "কাকিনা": "KAKINA",
        "হাতিবান্ধা": "HATIBANDHA", "পাটগ্রাম": "PATGRAM",
        "বুড়িমারী": "BURIMARI", "সৈয়দপুর": "SAIDPUR",
        "নীলফামারী": "NILPHAMARI", "ডোমার": "DOMAR",
        "চিলাহাটি": "CHILAHATI", "আজিমনগর": "AZIMNAGOR",
        "চাঁপাইনবাবগঞ্জ": "CHAPAI NAWABGANJ", "রোহনপুর": "ROHANPUR",
    }


def clean_cell(val) -> str:
    """Normalise a cell value to a trimmed string."""
    if val is None:
        return ""
    return str(val).strip()


def is_number(val) -> bool:
    try:
        f = float(clean_cell(val))
        return f > 0
    except (ValueError, TypeError):
        return False


def to_int(val) -> int:
    try:
        return int(float(clean_cell(val)))
    except (ValueError, TypeError):
        return 0


def map_class(header_text: str) -> str | None:
    """Map a column header to a DB seat class code. Returns None if not recognised."""
    t = clean_cell(header_text).strip()
    # Direct match
    if t in CLASS_MAP:
        return CLASS_MAP[t]
    tl = t.lower()
    if tl in CLASS_MAP:
        return CLASS_MAP[tl]
    # Partial match for tricky cases
    for key, code in CLASS_MAP.items():
        if key in t or key in tl:
            return code
    return None


def iter_xls_rows(path: Path):
    """Yield (row_index, [cell_values]) for every row in the first sheet of an XLS."""
    wb = xlrd.open_workbook(str(path))
    ws = wb.sheets()[0]
    for r in range(ws.nrows):
        yield r, [clean_cell(ws.cell_value(r, c)) for c in range(ws.ncols)]


def iter_xlsx_rows(path: Path):
    """Yield (row_index, [cell_values]) for every row in the first sheet of an XLSX."""
    wb = openpyxl.load_workbook(str(path), read_only=True, data_only=True)
    ws = wb.active
    for r_idx, row in enumerate(ws.iter_rows(values_only=True)):
        yield r_idx, [clean_cell(v) for v in row]


def detect_and_parse(path: Path, station_lookup: dict, is_legacy: bool, vat_included: bool) -> tuple[list[dict], dict]:
    """
    Auto-detect the fare table layout and extract fare rows.

    Layout A (flat):
        Col 0 = From station
        Col 1 = To station
        Col 2+ = fare class columns

    Layout B (grouped — same as PDF matrix):
        Header row 1: train/file title
        Header row 2: class column labels
        Data: "FROM STATION" label rows (merged / repeated)
              followed by "TO STATION" rows with fare amounts

    Returns (fare_rows, stats).
    """
    rows = []
    ext = path.suffix.lower()
    if ext == ".xls":
        raw_rows = list(iter_xls_rows(path))
    elif ext in (".xlsx", ".xlsm"):
        raw_rows = list(iter_xlsx_rows(path))
    else:
        return [], {"skipped_format": str(path.name)}

    if not raw_rows:
        return [], {"empty": True}

    stats: dict = {"accepted": 0, "no_station_match": [], "no_class_match": [], "duplicate": 0}

    # -----------------------------------------------------------------------
    # Step 1: find the header row (contains class column labels)
    # -----------------------------------------------------------------------
    class_col_map: dict[int, str] = {}   # col_index → DB_CLASS_CODE
    header_row_idx = -1

    for r_idx, row in raw_rows:
        matched_classes = {}
        for c_idx, cell in enumerate(row):
            code = map_class(cell)
            if code:
                matched_classes[c_idx] = code
        if len(matched_classes) >= 2:
            class_col_map = matched_classes
            header_row_idx = r_idx
            break

    if header_row_idx < 0:
        stats["no_header_found"] = True
        return [], stats

    # -----------------------------------------------------------------------
    # Step 2: determine layout (flat vs grouped)
    # -----------------------------------------------------------------------
    # Look at the first few data rows after the header
    data_start = header_row_idx + 1
    first_data_rows = [raw_rows[i] for i in range(data_start, min(data_start + 10, len(raw_rows)))]

    # In a FLAT layout, every data row has a "from" and "to" station plus numbers.
    # In a GROUPED layout, there are "from station" header rows (no numbers) followed
    # by "to station" rows (with numbers).
    def row_has_numbers(row) -> bool:
        return sum(1 for c in row if is_number(c)) >= 2

    def row_station_count(row, lookup) -> int:
        return sum(1 for c in row if lookup.get(clean_cell(c).strip()))

    # Heuristic: if first non-empty data row has >= 2 station-like cells → FLAT
    is_flat = False
    for _, row in first_data_rows:
        non_empty = [c for c in row if c]
        if not non_empty:
            continue
        if row_station_count(row, station_lookup) >= 2 and row_has_numbers(row):
            is_flat = True
        break

    fare_key_seen: set = set()

    def add_row(from_city: str, to_city: str, class_code: str, amount: int,
                is_legacy_route: bool, vat_incl: bool):
        nonlocal stats
        key = (from_city, to_city, class_code)
        if key in fare_key_seen:
            stats["duplicate"] += 1
            return
        fare_key_seen.add(key)
        note_parts = ["VERIFIED_XLS tier — official BR fare chart (railway.gov.bd, Dec 2024 upload)"]
        if is_legacy_route:
            note_parts.append("LEGACY_ROUTE: file reflects pre-Padma Bridge route; terminal fares valid, intermediate stops may differ from current service.")
        if vat_incl:
            note_parts.append("VAT_INCLUDED: fares in this file include VAT (ভ্যাট সহ).")
        rows.append({
            "from_city": from_city,
            "to_city": to_city,
            "seat_class_code": class_code,
            "base_fare": amount,
            "vat_amount": 0,
            "online_charge": 0,
            "last_verified": "2025-02-13",  # page content last updated Feb 2025
            "note": " | ".join(note_parts),
        })
        stats["accepted"] += 1

    def resolve_station(raw: str) -> str | None:
        raw = raw.strip()
        if not raw:
            return None
        # Direct lookup
        if raw in station_lookup:
            return station_lookup[raw]
        # Uppercase lookup
        if raw.upper() in station_lookup:
            return station_lookup[raw.upper()]
        # Strip trailing/leading noise and retry
        cleaned = re.sub(r"[।/،,]+", "", raw).strip()
        if cleaned in station_lookup:
            return station_lookup[cleaned]
        return None

    # -----------------------------------------------------------------------
    # Step 3a: FLAT layout parsing
    # -----------------------------------------------------------------------
    if is_flat:
        # Find which columns are from/to vs class
        # Class columns already identified. From is col 0 or col before classes.
        min_class_col = min(class_col_map.keys())
        from_col = 0
        to_col = 1 if min_class_col > 1 else None

        for r_idx, row in raw_rows[data_start:]:
            if not row_has_numbers(row):
                continue
            from_raw = row[from_col] if from_col < len(row) else ""
            from_city = resolve_station(from_raw)
            if not from_city:
                if from_raw:
                    stats["no_station_match"].append(from_raw)
                continue

            if to_col is not None and to_col < len(row):
                to_raw = row[to_col]
                to_city = resolve_station(to_raw)
            else:
                to_city = None

            if not to_city:
                if to_col is not None and to_col < len(row) and row[to_col]:
                    stats["no_station_match"].append(row[to_col])
                continue

            for c_idx, class_code in class_col_map.items():
                if c_idx < len(row) and is_number(row[c_idx]):
                    amount = to_int(row[c_idx])
                    if amount > 0:
                        add_row(from_city, to_city, class_code, amount, is_legacy, vat_included)
                        # Also add reverse
                        add_row(to_city, from_city, class_code, amount, is_legacy, vat_included)

    # -----------------------------------------------------------------------
    # Step 3b: GROUPED layout parsing
    # -----------------------------------------------------------------------
    else:
        current_from: str | None = None

        for r_idx, row in raw_rows[data_start:]:
            non_empty = [c for c in row if c]
            if not non_empty:
                continue

            # Skip repeated header rows
            if any(map_class(c) for c in row):
                continue

            has_nums = row_has_numbers(row)

            if not has_nums:
                # Could be a "from station" header row
                for cell in row:
                    city = resolve_station(cell)
                    if city:
                        current_from = city
                        break
            else:
                if current_from is None:
                    continue
                # This is a "to station" row. Find to-station cell (first non-number non-empty).
                to_city = None
                for c_idx, cell in enumerate(row):
                    if c_idx in class_col_map:
                        continue
                    candidate = resolve_station(cell)
                    if candidate:
                        to_city = candidate
                        break

                if to_city is None:
                    # Try first non-empty non-number cell
                    for cell in row:
                        if cell and not is_number(cell):
                            stats["no_station_match"].append(cell)
                            break
                    continue

                for c_idx, class_code in class_col_map.items():
                    if c_idx < len(row) and is_number(row[c_idx]):
                        amount = to_int(row[c_idx])
                        if amount > 0:
                            add_row(current_from, to_city, class_code, amount, is_legacy, vat_included)
                            add_row(to_city, current_from, class_code, amount, is_legacy, vat_included)

    # Deduplicate no_station_match list
    seen_unmatched = set()
    stats["no_station_match"] = [
        x for x in stats["no_station_match"]
        if x not in seen_unmatched and not seen_unmatched.add(x)  # type: ignore[func-returns-value]
    ]

    return rows, stats


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Parse BR West Zone XLS fare files")
    parser.add_argument("--dir", default="./west_fare_files",
                        help="Directory containing downloaded fare XLS/XLSX files")
    parser.add_argument("--out", default="fares_west.json",
                        help="Output JSON file path")
    parser.add_argument("--merge", metavar="EXISTING_JSON",
                        help="If given, merge into this existing fares JSON and overwrite it")
    args = parser.parse_args()

    fare_dir = Path(args.dir)
    if not fare_dir.exists():
        sys.exit(f"Directory not found: {fare_dir}\nCreate it and place the XLS files inside.")

    print("Loading station lookup...")
    station_lookup = load_station_lookup()

    all_fares: list[dict] = []
    files_processed = 0
    files_skipped: list[str] = []

    xls_files = sorted(list(fare_dir.glob("*.xls")) + list(fare_dir.glob("*.xlsx")))

    if not xls_files:
        sys.exit(f"No XLS/XLSX files found in {fare_dir}")

    print(f"\nProcessing {len(xls_files)} file(s)...\n")

    for fp in xls_files:
        is_legacy = fp.name in LEGACY_ROUTE_FILES
        vat_incl = fp.name in VAT_INCLUDED_FILES

        print(f"  [{fp.name}]")
        if fp.suffix.lower() == ".pdf":
            print(f"    ⚠ PDF format — skipping (requires pdfplumber + rasterize). Process separately.")
            files_skipped.append(fp.name)
            continue

        try:
            fare_rows, stats = detect_and_parse(fp, station_lookup, is_legacy, vat_incl)
        except Exception as e:
            print(f"    ✗ ERROR: {e}")
            files_skipped.append(fp.name)
            continue

        print(f"    ✓ Accepted rows: {stats.get('accepted', 0)}")
        if stats.get("no_station_match"):
            unmatched = stats["no_station_match"][:5]
            print(f"    ⚠ Unmatched stations ({len(stats['no_station_match'])} unique): {unmatched}")
        if stats.get("duplicate", 0) > 0:
            print(f"    ℹ Duplicate rows discarded: {stats['duplicate']}")
        if stats.get("no_header_found"):
            print(f"    ✗ Could not find class header row — check file layout manually")
            files_skipped.append(fp.name)
            continue

        all_fares.extend(fare_rows)
        files_processed += 1

    # Global deduplication across files
    seen_global: set = set()
    deduped: list[dict] = []
    for row in all_fares:
        key = (row["from_city"], row["to_city"], row["seat_class_code"])
        if key not in seen_global:
            seen_global.add(key)
            deduped.append(row)

    print(f"\n{'─'*60}")
    print(f"Files processed:  {files_processed}")
    print(f"Files skipped:    {len(files_skipped)} {files_skipped if files_skipped else ''}")
    print(f"Total fare rows:  {len(deduped)}")
    print(f"{'─'*60}\n")

    # -----------------------------------------------------------------------
    # Write output
    # -----------------------------------------------------------------------
    if args.merge and Path(args.merge).exists():
        with open(args.merge) as f:
            existing = json.load(f)

        existing_fares = existing.get("fares", [])
        existing_keys = {(r["from_city"], r["to_city"], r["seat_class_code"]) for r in existing_fares}

        new_only = [r for r in deduped if (r["from_city"], r["to_city"], r["seat_class_code"]) not in existing_keys]
        combined = existing_fares + new_only
        existing["fares"] = combined

        with open(args.merge, "w", encoding="utf-8") as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)

        print(f"Merged {len(new_only)} new rows into {args.merge}")
        print(f"Total fares in merged file: {len(combined)}")
    else:
        output = {"fares": deduped}
        out_path = Path(args.out)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"Wrote {len(deduped)} fare rows to {out_path}")


if __name__ == "__main__":
    main()
