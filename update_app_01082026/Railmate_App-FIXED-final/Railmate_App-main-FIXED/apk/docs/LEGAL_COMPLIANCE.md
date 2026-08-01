# RailMate Bangladesh — Legal Compliance

**Last Updated:** 2026-06-10  
**Status:** Review required before public launch

---

## Summary Risk Table

| Item | Risk Level | Status | Action Required |
|------|-----------|--------|-----------------|
| Shohoz API usage | 🔴 High | **PROHIBITED without written partnership** | See Master Reference Part 02 §2.1 — do not call, cache, or build schema around it |
| OpenStreetMap tiles | 🟢 Low | ODbL — attribution required | Add attribution notice |
| Nominatim geocoding | 🟢 Low | Free with usage limits | Seed DB once, then don't re-query |
| GitHub MIT repos (trains data) | 🟢 Low | MIT License | Keep license attribution |
| Wikipedia data | 🟢 Low | CC BY-SA 4.0 | Attribution required |
| BR official timetable PDF | 🟢 Low | Government publication | Informational use permitted |
| Scraping eticket.railway.gov.bd | 🔴 High | **PROHIBITED** | Never do this |
| Embedding user BR credentials | 🔴 High | **PROHIBITED** | Never do this |
| TTMS / BR Explorer API | 🔴 High | Proprietary (SUNCROPS Ltd) | Requires paid agreement |

---

## 1. Shohoz API

### Risk: 🔴 HIGH — PROHIBITED, not a portfolio-only exception

**Correction (2026-06-20):** an earlier version of this document rated this
🟡 Medium and treated unauthorized use as acceptable for "portfolio" or demo
purposes. That contradicts the project's own Master Reference, Part 02 §2.1,
which lists "Reverse-engineering Shohoz/Rail Sheba API without explicit
written partnership" and "Reproducing Shohoz schedule data without licensing
agreement" as **strictly forbidden**, with no demo/portfolio carve-out. The
Master Reference is the source of truth for this project; this document was
wrong, not the other way around.

**Situation:**
- The Shohoz Bangladesh Railway API (`railspaapi.shohoz.com`) is used by the official BR e-ticket portal
- Other, unrelated open-source projects use these endpoints — that does not
  extend any permission to this project, and "other projects haven't been
  sued yet" is not a license
- No explicit "Public API" documentation or ToS was found (shohoz.com/terms returns 404 as of 2026-06-10)

**Project Policy:**
- 🚫 No code in this repository may call `railspaapi.shohoz.com` or any
  Shohoz endpoint, in any environment, for any reason, including caching,
  fare lookups, or seat availability — until Part 2.5's partnership status
  changes from "Pending" to a signed written agreement
- 🚫 No database column may be designed around a Shohoz-specific identifier
  (e.g. a city-name string matching their API's expected format) — that
  couples the schema to a dependency we're not permitted to use
- Partnership outreach (Appendix A's template) is the correct path forward,
  not implementation-first/permission-later
- Shohoz website: https://www.shohoz.com
- BD Railway IT department: railway.gov.bd

---

## 2. OpenStreetMap

### Risk: 🟢 LOW

**License:** Open Database License (ODbL)

**Requirements:**
1. **Attribution:** You MUST display "© OpenStreetMap contributors" visibly on any map
2. **Share-alike:** If you produce a derived database, it must also be ODbL
3. **Tiles Usage Policy:** https://operations.osmfoundation.org/policies/tiles/
   - For heavy production use (>1M tile requests/month), use a paid tile provider (MapTiler, Stadia Maps)
   - For low-traffic portfolio: OSM tiles are acceptable

**Required attribution text:**
```
Map data © OpenStreetMap contributors, ODbL
```

---

## 3. Nominatim

### Risk: 🟢 LOW (if used correctly)

**License:** ODbL (same as OSM)

**Usage Policy:** https://operations.osmfoundation.org/policies/nominatim/
- Maximum 1 request/second
- Must cache results
- **No bulk geocoding**
- Must include User-Agent header identifying your app

**Recommended usage:**
- Use once to seed `lat`/`lng` into your stations.json
- Never call Nominatim at runtime per user request
- Never loop through 400+ stations rapidly

---

## 4. Wikipedia Data

### Risk: 🟢 LOW

**License:** Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0)

**Requirements:**
- Attribution to Wikipedia/contributors
- Any derived work must also be CC BY-SA

**In practice:** Train names, numbers, route information, and station codes are factual data not copyrightable. Using Wikipedia as a verification source is standard practice.

---

## 5. MIT-Licensed GitHub Repos

### Risk: 🟢 LOW

**Repos used:**
- shakiliitju/Bangladesh-Railway (MIT)
- nishatrhythm/Bangladesh-Railway-Train-Seat-Matrix-Web-Application (MIT)

**Requirements:**
- Keep copyright notice and MIT license text when distributing the data files
- Add to your project's THIRD_PARTY_LICENSES.md

---

## 6. Explicitly Prohibited Actions

### 🔴 NEVER DO THESE:

**6.1 Scraping eticket.railway.gov.bd**
- This is the official government booking system
- Scraping it violates:
  - Bangladesh ICT Act 2006 (Section 57 — unauthorized computer access)
  - Potential Computer Crimes Act violations
  - Terms implied by government service portals

**6.2 TTMS API (BR Explorer / SUNCROPS)**
- The TTMS (Train Tracking Management System) API is proprietary
- Owned by SUNCROPS Ltd under a 2013 contract with Bangladesh Railway
- Requires a paid commercial agreement starting at 10 BDT/request
- Using it without a contract is unauthorized access
- Contact: info@suncrops.com.bd to enter a legal agreement

**6.3 Embedding Credentials**
- Never hardcode BR user mobile/password in your app
- Never store user passwords in plaintext

**6.4 Automating Ticket Purchases**
- Automated ticket purchasing (bots) likely violates BR's fair-use policies
- Can be considered fraud under Bangladesh law if used to corner seat inventory

---

## 7. Bangladesh ICT Act Reference

- **Bangladesh ICT Act 2006:** https://bcc.gov.bd
- Relevant sections: unauthorized computer access, data interception
- Government IT systems (eticket.railway.gov.bd) have heightened protections

---

## 8. Pre-Launch Checklist

Before making RailMate public:

- [ ] Add OSM attribution to all map views
- [ ] Confirm zero Shohoz API calls anywhere in the codebase (`grep -ri "shohoz" --include=*.ts --include=*.tsx` across all runtime code, not docs) — must return nothing until a written partnership exists
- [ ] Add Privacy Policy page (if collecting user data)
- [ ] Add Terms of Service page
- [ ] Implement rate limiting to avoid API abuse
- [ ] Add "Data may not be 100% accurate — verify at eticket.railway.gov.bd" disclaimer
- [ ] Ensure no user credentials are stored
- [ ] Review THIRD_PARTY_LICENSES.md — add all license texts
