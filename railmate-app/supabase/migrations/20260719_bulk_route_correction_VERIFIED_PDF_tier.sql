-- ============================================================
-- RailMate Bangladesh — bulk route correction, VERIFIED_PDF tier only
-- 33 trains where trains.json origin/destination disagreed with
-- train_stops.json is_origin/is_destination. Applying train_stops.json
-- (official BR PDF, text-layer extraction, highest confidence tier).
-- VERIFIED_IMG and PDF_SUMMARY_COMMUTER tier mismatches (24 trains)
-- deliberately excluded — need manual PDF spot-check first.
-- ============================================================

BEGIN;

-- ── Train 705 — Ekota Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'DHKA'),
  destination_id = (SELECT id FROM stations WHERE code = 'PCG'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '705';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '705');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '705'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'DHKA', NULL, '10:15', TRUE, FALSE, 0),
  (2, 'DABB', '10:38', '10:43', FALSE, FALSE, 0),
  (3, 'JDP', '11:06', '11:09', FALSE, FALSE, 0),
  (4, 'TGL', '12:03', '12:05', FALSE, FALSE, 0),
  (5, 'IBD', '12:25', '12:27', FALSE, FALSE, 0),
  (6, 'SMA', '12:43', '12:45', FALSE, FALSE, 0),
  (7, 'ULP', '13:01', '13:04', FALSE, FALSE, 0),
  (8, 'IWDB', '14:09', '14:11', FALSE, FALSE, 0),
  (9, 'NTR', '14:53', '14:57', FALSE, FALSE, 0),
  (10, 'STH', '16:00', '16:05', FALSE, FALSE, 0),
  (11, 'AHG', '16:25', '16:27', FALSE, FALSE, 0),
  (12, 'JPH', '16:50', '16:53', FALSE, FALSE, 0),
  (13, 'PCB', '17:12', '17:14', FALSE, FALSE, 0),
  (14, 'BRM', '17:34', '17:37', FALSE, FALSE, 0),
  (15, 'FLB', '17:48', '17:51', FALSE, FALSE, 0),
  (16, 'PBP', '18:15', '18:25', FALSE, FALSE, 0),
  (17, 'CRB', '18:40', '18:42', FALSE, FALSE, 0),
  (18, 'DNJ', '19:00', '19:05', FALSE, FALSE, 0),
  (19, 'STB', '19:35', '19:37', FALSE, FALSE, 0),
  (20, 'PRJ', '19:51', '19:53', FALSE, FALSE, 0),
  (21, 'TKG', '20:15', '20:18', FALSE, FALSE, 0),
  (22, 'RHI', '20:33', '20:35', FALSE, FALSE, 0),
  (23, 'KSM', '20:42', '20:44', FALSE, FALSE, 0),
  (24, 'PCG', '21:00', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 706 — Ekota Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'PCG'),
  destination_id = (SELECT id FROM stations WHERE code = 'DHKA'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '706';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '706');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '706'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'PCG', NULL, '21:10', TRUE, FALSE, 0),
  (2, 'KSM', '21:25', '21:27', FALSE, FALSE, 0),
  (3, 'RHI', '21:34', '21:36', FALSE, FALSE, 0),
  (4, 'TKG', '21:51', '21:54', FALSE, FALSE, 0),
  (5, 'PRJ', '22:16', '22:18', FALSE, FALSE, 0),
  (6, 'STB', '22:32', '22:34', FALSE, FALSE, 0),
  (7, 'DNJ', '23:05', '23:13', FALSE, FALSE, 0),
  (8, 'CRB', '23:30', '23:32', FALSE, FALSE, 0),
  (9, 'PBP', '23:50', '00:28', FALSE, FALSE, 1),
  (10, 'FLB', '00:31', '00:42', FALSE, FALSE, 1),
  (11, 'BRM', '00:45', '01:05', FALSE, FALSE, 1),
  (12, 'JPH', '01:18', '01:21', FALSE, FALSE, 1),
  (13, 'AHG', '01:35', '01:37', FALSE, FALSE, 1),
  (14, 'STH', '01:55', '02:00', FALSE, FALSE, 1),
  (15, 'NTR', '02:41', '02:44', FALSE, FALSE, 1),
  (16, 'IWDB', '04:12', '04:15', FALSE, FALSE, 1),
  (17, 'ULP', '04:50', '04:52', FALSE, FALSE, 1),
  (18, 'SMA', '05:12', '05:14', FALSE, FALSE, 1),
  (19, 'TGL', '06:18', '06:21', FALSE, FALSE, 1),
  (20, 'JDP', '06:47', '06:50', FALSE, FALSE, 1),
  (21, 'DHKA', '07:20', NULL, FALSE, TRUE, 1)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 713 — Korotoa Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'STH'),
  destination_id = (SELECT id FROM stations WHERE code = 'BMR'),
  days_of_week   = ARRAY[0, 1, 2, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '713';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '713');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '713'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'STH', NULL, '09:25', TRUE, FALSE, 0),
  (2, 'BOG', '10:09', '10:19', FALSE, FALSE, 0),
  (3, 'BNP2', '10:51', '10:53', FALSE, FALSE, 0),
  (4, 'MHG', '11:03', '11:05', FALSE, FALSE, 0),
  (5, 'SNT', '11:15', '11:20', FALSE, FALSE, 0),
  (6, 'GBD', '11:59', '12:04', FALSE, FALSE, 0),
  (7, 'BMD', '12:33', '12:35', FALSE, FALSE, 0),
  (8, 'PGC', '12:53', '12:55', FALSE, FALSE, 0),
  (9, 'KWN', '13:12', '13:15', FALSE, FALSE, 0),
  (10, 'TST', '13:22', '13:24', FALSE, FALSE, 0),
  (11, 'LMH', '13:40', '13:50', FALSE, FALSE, 0),
  (12, 'ADT', '14:05', '14:07', FALSE, FALSE, 0),
  (13, 'KKN', '14:25', '14:27', FALSE, FALSE, 0),
  (14, 'SLB', '14:34', '14:36', FALSE, FALSE, 0),
  (15, 'HTB', '15:02', '15:04', FALSE, FALSE, 0),
  (16, 'BKT', '15:16', '15:18', FALSE, FALSE, 0),
  (17, 'BWR', '15:27', '15:29', FALSE, FALSE, 0),
  (18, 'PTG', '15:44', '15:47', FALSE, FALSE, 0),
  (19, 'BMR', '16:00', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 714 — Korotoa Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'BMR'),
  destination_id = (SELECT id FROM stations WHERE code = 'STH'),
  days_of_week   = ARRAY[0, 1, 2, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '714';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '714');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '714'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'BMR', NULL, '16:20', TRUE, FALSE, 0),
  (2, 'PTG', '16:33', '16:36', FALSE, FALSE, 0),
  (3, 'BWR', '16:51', '16:53', FALSE, FALSE, 0),
  (4, 'BKT', '17:02', '17:04', FALSE, FALSE, 0),
  (5, 'HTB', '17:16', '17:19', FALSE, FALSE, 0),
  (6, 'SLB', '17:43', '17:45', FALSE, FALSE, 0),
  (7, 'KKN', '17:52', '17:54', FALSE, FALSE, 0),
  (8, 'ADT', '18:08', '18:10', FALSE, FALSE, 0),
  (9, 'LMH', '18:25', '18:45', FALSE, FALSE, 0),
  (10, 'TST', '19:01', '19:03', FALSE, FALSE, 0),
  (11, 'KWN', '19:10', '19:13', FALSE, FALSE, 0),
  (12, 'PGC', '19:28', '19:31', FALSE, FALSE, 0),
  (13, 'BMD', '19:48', '19:50', FALSE, FALSE, 0),
  (14, 'GBD', '20:20', '20:23', FALSE, FALSE, 0),
  (15, 'SNT', '20:45', '20:50', FALSE, FALSE, 0),
  (16, 'MHG', '21:00', '21:02', FALSE, FALSE, 0),
  (17, 'BNP2', '21:11', '21:13', FALSE, FALSE, 0),
  (18, 'BOG', '21:45', '21:50', FALSE, FALSE, 0),
  (19, 'STH', '22:40', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 715 — Kapotaksha Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'KHU'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[0, 1, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '715';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '715');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '715'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'KHU', NULL, '06:45', TRUE, FALSE, 0),
  (2, 'NWP', '07:18', '07:20', FALSE, FALSE, 0),
  (3, 'JS', '07:48', '07:51', FALSE, FALSE, 0),
  (4, 'MBG', '08:18', '08:20', FALSE, FALSE, 0),
  (5, 'KCP', '08:31', '08:33', FALSE, FALSE, 0),
  (6, 'SFP', '08:42', '08:44', FALSE, FALSE, 0),
  (7, 'DSH', '09:02', '09:05', FALSE, FALSE, 0),
  (8, 'CWD', '09:24', '09:27', FALSE, FALSE, 0),
  (9, 'ALD', '09:42', '09:44', FALSE, FALSE, 0),
  (10, 'PDA', '10:00', '10:03', FALSE, FALSE, 0),
  (11, 'MZP', '10:13', '10:15', FALSE, FALSE, 0),
  (12, 'BMA', '10:25', '10:27', FALSE, FALSE, 0),
  (13, 'PKS', '10:39', '10:41', FALSE, FALSE, 0),
  (14, 'IWD', '10:50', '11:10', FALSE, FALSE, 0),
  (15, 'AZN', '11:22', '11:24', FALSE, FALSE, 0),
  (16, 'RAJ', '12:20', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 716 — Kapotaksha Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'KHU'),
  days_of_week   = ARRAY[0, 1, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '716';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '716');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '716'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '14:30', TRUE, FALSE, 0),
  (2, 'AZN', '15:16', '15:18', FALSE, FALSE, 0),
  (3, 'IWD', '15:30', '15:45', FALSE, FALSE, 0),
  (4, 'PKS', '15:55', '15:57', FALSE, FALSE, 0),
  (5, 'BMA', '16:09', '16:12', FALSE, FALSE, 0),
  (6, 'MZP', '16:22', '16:24', FALSE, FALSE, 0),
  (7, 'PDA', '16:34', '16:37', FALSE, FALSE, 0),
  (8, 'ALD', '16:53', '16:55', FALSE, FALSE, 0),
  (9, 'CWD', '17:11', '17:14', FALSE, FALSE, 0),
  (10, 'DSH', '17:34', '17:37', FALSE, FALSE, 0),
  (11, 'SFP', '17:55', '17:58', FALSE, FALSE, 0),
  (12, 'KCP', '18:14', '18:16', FALSE, FALSE, 0),
  (13, 'MBG', '18:28', '18:30', FALSE, FALSE, 0),
  (14, 'JS', '19:05', '19:10', FALSE, FALSE, 0),
  (15, 'NWP', '19:38', '19:41', FALSE, FALSE, 0),
  (16, 'KHU', '20:25', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 727 — Rupsha Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'KHU'),
  destination_id = (SELECT id FROM stations WHERE code = 'CLH'),
  days_of_week   = ARRAY[0, 1, 2, 3, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '727';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '727');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '727'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'KHU', NULL, '07:15', TRUE, FALSE, 0),
  (2, 'NWP', '07:48', '07:51', FALSE, FALSE, 0),
  (3, 'JS', '08:19', '08:23', FALSE, FALSE, 0),
  (4, 'MBG', '08:50', '08:52', FALSE, FALSE, 0),
  (5, 'KCP', '09:03', '09:05', FALSE, FALSE, 0),
  (6, 'DSH', '09:41', '09:44', FALSE, FALSE, 0),
  (7, 'CWD', '10:03', '10:06', FALSE, FALSE, 0),
  (8, 'ALD', '10:21', '10:23', FALSE, FALSE, 0),
  (9, 'PDA', '10:39', '10:42', FALSE, FALSE, 0),
  (10, 'BMA', '10:59', '11:02', FALSE, FALSE, 0),
  (11, 'PKS', '11:14', '11:16', FALSE, FALSE, 0),
  (12, 'IWD', '11:25', '11:40', FALSE, FALSE, 0),
  (13, 'STH', '12:13', '12:16', FALSE, FALSE, 0),
  (14, 'JPH', '13:00', '13:30', FALSE, FALSE, 0),
  (15, 'BRM', '13:36', '13:50', FALSE, FALSE, 0),
  (16, 'FLB', '14:05', '14:08', FALSE, FALSE, 0),
  (17, 'PBP', '14:36', '14:38', FALSE, FALSE, 0),
  (18, 'SYP', '15:10', '15:20', FALSE, FALSE, 0),
  (19, 'NLF', '15:37', '15:42', FALSE, FALSE, 0),
  (20, 'DOM', '16:05', '16:08', FALSE, FALSE, 0),
  (21, 'CLH', '16:24', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 728 — Rupsha Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'CLH'),
  destination_id = (SELECT id FROM stations WHERE code = 'KHU'),
  days_of_week   = ARRAY[0, 1, 2, 3, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '728';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '728');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '728'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'CLH', NULL, '08:30', TRUE, FALSE, 0),
  (2, 'DOM', '08:48', '08:51', FALSE, FALSE, 0),
  (3, 'NLF', '09:07', '09:10', FALSE, FALSE, 0),
  (4, 'SYP', '09:30', '09:35', FALSE, FALSE, 0),
  (5, 'PBP', '09:55', '10:15', FALSE, FALSE, 0),
  (6, 'FLB', '10:36', '10:39', FALSE, FALSE, 0),
  (7, 'BRM', '10:50', '10:53', FALSE, FALSE, 0),
  (8, 'JPH', '11:22', '11:25', FALSE, FALSE, 0),
  (9, 'STH', '12:00', '12:05', FALSE, FALSE, 0),
  (10, 'IWD', '12:28', '12:31', FALSE, FALSE, 0),
  (11, 'PDA', '14:24', '14:27', FALSE, FALSE, 0),
  (12, 'ALD', '14:44', '14:47', FALSE, FALSE, 0),
  (13, 'CWD', '15:02', '15:04', FALSE, FALSE, 0),
  (14, 'DSH', '15:20', '15:23', FALSE, FALSE, 0),
  (15, 'KCP', '15:45', '15:48', FALSE, FALSE, 0),
  (16, 'MBG', '16:14', '16:16', FALSE, FALSE, 0),
  (17, 'JS', '16:28', '16:30', FALSE, FALSE, 0),
  (18, 'NWP', '17:36', '17:39', FALSE, FALSE, 0),
  (19, 'KHU', '18:25', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 731 — Barendra Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'CLH'),
  days_of_week   = ARRAY[1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '731';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '731');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '731'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '15:00', TRUE, FALSE, 0),
  (2, 'ALP', '15:40', '16:00', FALSE, FALSE, 0),
  (3, 'NTR', '16:17', '16:20', FALSE, FALSE, 0),
  (4, 'AHG', '16:41', '16:44', FALSE, FALSE, 0),
  (5, 'STH', '17:20', '17:30', FALSE, FALSE, 0),
  (6, 'JPH', '18:07', '18:10', FALSE, FALSE, 0),
  (7, 'PCB', '18:28', '18:30', FALSE, FALSE, 0),
  (8, 'BRM', '18:50', '18:53', FALSE, FALSE, 0),
  (9, 'FLB', '19:04', '19:07', FALSE, FALSE, 0),
  (10, 'PBP', '19:25', '19:45', FALSE, FALSE, 0),
  (11, 'NLF', '20:33', '20:36', FALSE, FALSE, 0),
  (12, 'DOM', '20:58', '21:01', FALSE, FALSE, 0),
  (13, 'CLH', '21:30', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 732 — Barendra Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'CLH'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '732';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '732');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '732'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'CLH', NULL, '05:00', TRUE, FALSE, 0),
  (2, 'DOM', '05:18', '05:21', FALSE, FALSE, 0),
  (3, 'NLF', '05:36', '05:39', FALSE, FALSE, 0),
  (4, 'FLB', '06:04', '06:08', FALSE, FALSE, 0),
  (5, 'PBP', '06:25', '06:45', FALSE, FALSE, 0),
  (6, 'JPH', '07:03', '07:06', FALSE, FALSE, 0),
  (7, 'AHG', '07:17', '07:20', FALSE, FALSE, 0),
  (8, 'STH', '07:33', '07:35', FALSE, FALSE, 0),
  (9, 'NTR', '07:45', '07:47', FALSE, FALSE, 0),
  (10, 'ALP', '08:01', '08:15', FALSE, FALSE, 0),
  (11, 'RAJ', '11:10', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 733 — Titumir Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'CLH'),
  days_of_week   = ARRAY[0, 1, 2, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '733';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '733');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '733'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '06:20', TRUE, FALSE, 0),
  (2, 'ALP', '07:00', '07:20', FALSE, FALSE, 0),
  (3, 'MDN', '07:47', '07:51', FALSE, FALSE, 0),
  (4, 'AHG', '08:05', '08:07', FALSE, FALSE, 0),
  (5, 'STH', '08:16', '08:19', FALSE, FALSE, 0),
  (6, 'JPH', '08:45', '08:50', FALSE, FALSE, 0),
  (7, 'PCB', '09:10', '09:12', FALSE, FALSE, 0),
  (8, 'BRM', '09:20', '09:22', FALSE, FALSE, 0),
  (9, 'FLB', '09:30', '09:33', FALSE, FALSE, 0),
  (10, 'PBP', '09:44', '09:46', FALSE, FALSE, 0),
  (11, 'SYP', '09:56', '09:58', FALSE, FALSE, 0),
  (12, 'NLF', '10:10', '10:13', FALSE, FALSE, 0),
  (13, 'DOM', '10:31', '10:34', FALSE, FALSE, 0),
  (14, 'CLH', '13:00', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 734 — Titumir Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'CLH'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[0, 1, 2, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '734';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '734');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '734'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'CLH', NULL, '15:00', TRUE, FALSE, 0),
  (2, 'DOM', '15:21', '15:24', FALSE, FALSE, 0),
  (3, 'NLF', '15:41', '15:44', FALSE, FALSE, 0),
  (4, 'SYP', '16:15', '16:19', FALSE, FALSE, 0),
  (5, 'PBP', '16:35', '16:55', FALSE, FALSE, 0),
  (6, 'FLB', '17:13', '17:16', FALSE, FALSE, 0),
  (7, 'BRM', '17:27', '17:30', FALSE, FALSE, 0),
  (8, 'PCB', '17:59', '18:01', FALSE, FALSE, 0),
  (9, 'JPH', '18:12', '18:15', FALSE, FALSE, 0),
  (10, 'AHG', '18:23', '18:25', FALSE, FALSE, 0),
  (11, 'STH', '18:33', '18:35', FALSE, FALSE, 0),
  (12, 'MDN', '18:55', '18:57', FALSE, FALSE, 0),
  (13, 'NTR', '19:50', '19:53', FALSE, FALSE, 0),
  (14, 'ALP', '20:10', '20:30', FALSE, FALSE, 0),
  (15, 'RAJ', '21:30', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 747 — Simanta Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'KHU'),
  destination_id = (SELECT id FROM stations WHERE code = 'CLH'),
  days_of_week   = ARRAY[0, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '747';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '747');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '747'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'KHU', NULL, '21:15', TRUE, FALSE, 0),
  (2, 'DLT', '21:27', '21:29', FALSE, FALSE, 0),
  (3, 'NWP', '21:52', '21:55', FALSE, FALSE, 0),
  (4, 'JS', '22:23', '22:27', FALSE, FALSE, 0),
  (5, 'MBG', '22:54', '22:56', FALSE, FALSE, 0),
  (6, 'KCP', '23:08', '23:10', FALSE, FALSE, 0),
  (7, 'CWD', '00:00', '00:16', FALSE, FALSE, 1),
  (8, 'ALD', '00:18', '00:34', FALSE, FALSE, 1),
  (9, 'BMA', '00:37', '00:54', FALSE, FALSE, 1),
  (10, 'IWD', '01:20', '01:30', FALSE, FALSE, 1),
  (11, 'NTR', '02:05', '02:08', FALSE, FALSE, 1),
  (12, 'STH', '03:05', '03:10', FALSE, FALSE, 1),
  (13, 'AHG', '03:30', '03:32', FALSE, FALSE, 1),
  (14, 'JPH', '03:46', '03:49', FALSE, FALSE, 1),
  (15, 'BRM', '04:17', '04:19', FALSE, FALSE, 1),
  (16, 'FLB', '04:30', '04:32', FALSE, FALSE, 1),
  (17, 'PBP', '04:50', '05:00', FALSE, FALSE, 1),
  (18, 'SYP', '05:17', '05:22', FALSE, FALSE, 1),
  (19, 'NLF', '05:41', '05:45', FALSE, FALSE, 1),
  (20, 'DOM', '06:01', '06:23', FALSE, FALSE, 1),
  (21, 'CLH', '06:45', NULL, FALSE, TRUE, 1)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 748 — Simanta Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'CLH'),
  destination_id = (SELECT id FROM stations WHERE code = 'KHU'),
  days_of_week   = ARRAY[0, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '748';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '748');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '748'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'CLH', NULL, '18:30', TRUE, FALSE, 0),
  (2, 'DOM', '18:48', '18:51', FALSE, FALSE, 0),
  (3, 'NLF', '19:07', '19:10', FALSE, FALSE, 0),
  (4, 'SYP', '19:29', '19:34', FALSE, FALSE, 0),
  (5, 'PBP', '19:50', '20:10', FALSE, FALSE, 0),
  (6, 'FLB', '20:28', '20:31', FALSE, FALSE, 0),
  (7, 'BRM', '20:42', '20:45', FALSE, FALSE, 0),
  (8, 'JPH', '21:14', '21:17', FALSE, FALSE, 0),
  (9, 'AHG', '21:31', '21:33', FALSE, FALSE, 0),
  (10, 'STH', '21:55', '22:00', FALSE, FALSE, 0),
  (11, 'NTR', '22:40', '22:43', FALSE, FALSE, 0),
  (12, 'IWD', '23:20', '23:40', FALSE, FALSE, 0),
  (13, 'BMA', '00:00', '00:03', FALSE, FALSE, 1),
  (14, 'ALD', '00:21', '00:24', FALSE, FALSE, 1),
  (15, 'CWD', '00:40', '00:42', FALSE, FALSE, 1),
  (16, 'DSH', '01:00', '01:03', FALSE, FALSE, 1),
  (17, 'KCP', '01:24', '01:26', FALSE, FALSE, 1),
  (18, 'MBG', '01:50', '01:52', FALSE, FALSE, 1),
  (19, 'JS', '02:41', '02:45', FALSE, FALSE, 1),
  (20, 'NWP', '03:13', '03:16', FALSE, FALSE, 1),
  (21, 'DLT', '03:41', '03:43', FALSE, FALSE, 1),
  (22, 'KHU', '04:10', NULL, FALSE, TRUE, 1)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 755 — Madhumati Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'DHKA'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '755';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '755');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '755'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'DHKA', NULL, '15:00', TRUE, FALSE, 0),
  (2, 'MAW', '15:36', '15:38', FALSE, FALSE, 0),
  (3, 'PDM', '15:51', '15:53', FALSE, FALSE, 0),
  (4, 'SBR', '16:03', '16:05', FALSE, FALSE, 0),
  (5, 'BNG', '16:28', '16:30', FALSE, FALSE, 0),
  (6, 'TLM', '16:46', '16:48', FALSE, FALSE, 0),
  (7, 'FRP', '17:03', '17:06', FALSE, FALSE, 0),
  (8, 'AMB', '17:18', '17:20', FALSE, FALSE, 0),
  (9, 'PCR', '17:35', '17:37', FALSE, FALSE, 0),
  (10, 'RBR', '17:45', '18:00', FALSE, FALSE, 0),
  (11, 'PAN', '18:23', '18:25', FALSE, FALSE, 0),
  (12, 'KMK', '18:35', '18:37', FALSE, FALSE, 0),
  (13, 'KKS', '18:51', '18:53', FALSE, FALSE, 0),
  (14, 'IWD', '21:05', '21:25', FALSE, FALSE, 0),
  (15, 'RAJ', '22:30', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 756 — Madhumati Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'DHKA'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '756';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '756');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '756'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '06:40', TRUE, FALSE, 0),
  (2, 'IWD', '07:40', '08:00', FALSE, FALSE, 0),
  (3, 'PKS', '08:10', '08:12', FALSE, FALSE, 0),
  (4, 'PDA', '08:50', '09:10', FALSE, FALSE, 0),
  (5, 'KKS', '09:22', '09:25', FALSE, FALSE, 0),
  (6, 'KMK', '09:42', '09:44', FALSE, FALSE, 0),
  (7, 'PAN', '10:01', '10:03', FALSE, FALSE, 0),
  (8, 'RBR', '10:18', '10:29', FALSE, FALSE, 0),
  (9, 'PCR', '11:14', '11:16', FALSE, FALSE, 0),
  (10, 'AMB', '11:32', '11:34', FALSE, FALSE, 0),
  (11, 'FRP', '11:47', '11:49', FALSE, FALSE, 0),
  (12, 'TLM', '12:05', '12:07', FALSE, FALSE, 0),
  (13, 'BNG', '12:24', '12:26', FALSE, FALSE, 0),
  (14, 'SBR', '12:47', '12:49', FALSE, FALSE, 0),
  (15, 'PDM', '12:59', '13:01', FALSE, FALSE, 0),
  (16, 'MAW', '13:14', '13:16', FALSE, FALSE, 0),
  (17, 'DHKA', '14:00', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 757 — Drutojan Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'DHKA'),
  destination_id = (SELECT id FROM stations WHERE code = 'PCG'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '757';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '757');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '757'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'DHKA', NULL, '20:45', TRUE, FALSE, 0),
  (2, 'DABB', '21:08', '21:13', FALSE, FALSE, 0),
  (3, 'JDP', '21:36', '21:38', FALSE, FALSE, 0),
  (4, 'TGL', '22:32', '22:34', FALSE, FALSE, 0),
  (5, 'IBD', '22:54', '22:56', FALSE, FALSE, 0),
  (6, 'CTM', '23:56', '23:58', FALSE, FALSE, 0),
  (7, 'NTR', '00:49', '00:52', FALSE, FALSE, 1),
  (8, 'STH', '01:13', '01:16', FALSE, FALSE, 1),
  (9, 'AHG', '01:45', '02:00', FALSE, FALSE, 1),
  (10, 'JPH', '02:20', '02:22', FALSE, FALSE, 1),
  (11, 'PCB', '02:37', '02:39', FALSE, FALSE, 1),
  (12, 'BRM', '03:12', '03:14', FALSE, FALSE, 1),
  (13, 'FLB', '03:25', '03:27', FALSE, FALSE, 1),
  (14, 'PBP', '03:50', '04:10', FALSE, FALSE, 1),
  (15, 'CRB', '04:25', '04:27', FALSE, FALSE, 1),
  (16, 'DNJ', '04:45', '04:50', FALSE, FALSE, 1),
  (17, 'STB', '05:20', '05:22', FALSE, FALSE, 1),
  (18, 'PRJ', '05:36', '05:39', FALSE, FALSE, 1),
  (19, 'TKG', '06:02', '06:05', FALSE, FALSE, 1),
  (20, 'RHI', '06:22', '06:38', FALSE, FALSE, 1),
  (21, 'KSM', '06:47', '06:49', FALSE, FALSE, 1),
  (22, 'PCG', '07:10', NULL, FALSE, TRUE, 1)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 758 — Drutojan Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'PCG'),
  destination_id = (SELECT id FROM stations WHERE code = 'DHKA'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '758';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '758');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '758'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'PCG', NULL, '07:20', TRUE, FALSE, 0),
  (2, 'KSM', '07:36', '07:38', FALSE, FALSE, 0),
  (3, 'RHI', '07:46', '07:48', FALSE, FALSE, 0),
  (4, 'TKG', '08:02', '08:05', FALSE, FALSE, 0),
  (5, 'PRJ', '08:46', '08:48', FALSE, FALSE, 0),
  (6, 'STB', '09:02', '09:04', FALSE, FALSE, 0),
  (7, 'DNJ', '09:36', '09:46', FALSE, FALSE, 0),
  (8, 'CRB', '10:05', '10:07', FALSE, FALSE, 0),
  (9, 'PBP', '10:25', '10:45', FALSE, FALSE, 0),
  (10, 'FLB', '11:03', '11:06', FALSE, FALSE, 0),
  (11, 'BRM', '11:17', '11:20', FALSE, FALSE, 0),
  (12, 'JPH', '11:53', '11:56', FALSE, FALSE, 0),
  (13, 'AHG', '12:09', '12:11', FALSE, FALSE, 0),
  (14, 'STH', '12:35', '12:40', FALSE, FALSE, 0),
  (15, 'NTR', '13:14', '13:16', FALSE, FALSE, 0),
  (16, 'CTM', '13:38', '13:41', FALSE, FALSE, 0),
  (17, 'IBD', '14:48', '14:51', FALSE, FALSE, 0),
  (18, 'TGL', '15:28', '15:30', FALSE, FALSE, 0),
  (19, 'JDP', '16:18', '16:28', FALSE, FALSE, 0),
  (20, 'DABB', '17:48', '17:53', FALSE, FALSE, 0),
  (21, 'DHKA', '18:55', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 761 — Sagardari Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'KHU'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[0, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '761';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '761');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '761'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'KHU', NULL, '16:00', TRUE, FALSE, 0),
  (2, 'NWP', '16:33', '16:36', FALSE, FALSE, 0),
  (3, 'JS', '17:03', '17:08', FALSE, FALSE, 0),
  (4, 'MBG', '17:35', '17:37', FALSE, FALSE, 0),
  (5, 'KCP', '17:49', '17:51', FALSE, FALSE, 0),
  (6, 'DSH', '18:21', '18:24', FALSE, FALSE, 0),
  (7, 'CWD', '18:43', '18:46', FALSE, FALSE, 0),
  (8, 'ALD', '19:02', '19:04', FALSE, FALSE, 0),
  (9, 'PDA', '19:20', '19:23', FALSE, FALSE, 0),
  (10, 'MZP', '19:33', '19:35', FALSE, FALSE, 0),
  (11, 'BMA', '19:45', '19:47', FALSE, FALSE, 0),
  (12, 'IWD', '20:10', '20:30', FALSE, FALSE, 0),
  (13, 'AZN', '20:43', '20:45', FALSE, FALSE, 0),
  (14, 'ALP', '20:53', '20:56', FALSE, FALSE, 0),
  (15, 'RAJ', '22:00', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 762 — Sagardari Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'KHU'),
  days_of_week   = ARRAY[0, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '762';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '762');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '762'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '06:00', TRUE, FALSE, 0),
  (2, 'ALP', '06:40', '06:42', FALSE, FALSE, 0),
  (3, 'AZN', '06:51', '06:53', FALSE, FALSE, 0),
  (4, 'IWD', '07:10', '07:30', FALSE, FALSE, 0),
  (5, 'BMA', '07:54', '07:57', FALSE, FALSE, 0),
  (6, 'MZP', '08:07', '08:09', FALSE, FALSE, 0),
  (7, 'PDA', '08:19', '08:22', FALSE, FALSE, 0),
  (8, 'ALD', '08:38', '08:40', FALSE, FALSE, 0),
  (9, 'CWD', '08:56', '08:59', FALSE, FALSE, 0),
  (10, 'DSH', '09:20', '09:23', FALSE, FALSE, 0),
  (11, 'KCP', '09:51', '09:53', FALSE, FALSE, 0),
  (12, 'MBG', '10:05', '10:07', FALSE, FALSE, 0),
  (13, 'JS', '10:35', '10:39', FALSE, FALSE, 0),
  (14, 'NWP', '11:07', '11:10', FALSE, FALSE, 0),
  (15, 'KHU', '12:10', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 764 — Chitra Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'DHKA'),
  destination_id = (SELECT id FROM stations WHERE code = 'NWP'),
  days_of_week   = ARRAY[1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '764';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '764');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '764'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'DHKA', NULL, '19:30', TRUE, FALSE, 0),
  (2, 'DABB', '19:53', '19:58', FALSE, FALSE, 0),
  (3, 'JDP', '20:21', '20:23', FALSE, FALSE, 0),
  (4, 'TGL', '21:26', '21:28', FALSE, FALSE, 0),
  (5, 'IBD', '21:48', '21:50', FALSE, FALSE, 0),
  (6, 'SMA', '22:06', '22:09', FALSE, FALSE, 0),
  (7, 'ULP', '22:26', '22:29', FALSE, FALSE, 0),
  (8, 'BAL', '22:47', '22:50', FALSE, FALSE, 0),
  (9, 'CTM', '23:04', '23:07', FALSE, FALSE, 0),
  (10, 'IWD', '23:45', '23:55', FALSE, FALSE, 0),
  (11, 'MZP', '00:46', '00:49', FALSE, FALSE, 1),
  (12, 'PDA', '01:05', '01:07', FALSE, FALSE, 1),
  (13, 'CWD', '01:24', '01:27', FALSE, FALSE, 1),
  (14, 'MBG', '03:07', '03:12', FALSE, FALSE, 1),
  (15, 'JS', '03:40', '03:43', FALSE, FALSE, 1),
  (16, 'NWP', '04:40', NULL, FALSE, TRUE, 1)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 767 — Dolonchapa Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'STH'),
  destination_id = (SELECT id FROM stations WHERE code = 'PCG'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '767';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '767');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '767'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'STH', NULL, '11:00', TRUE, FALSE, 0),
  (2, 'BOG', '11:28', '11:30', FALSE, FALSE, 0),
  (3, 'SNT', '11:53', '12:01', FALSE, FALSE, 0),
  (4, 'BNP2', '12:50', '12:52', FALSE, FALSE, 0),
  (5, 'GBD', '13:02', '13:04', FALSE, FALSE, 0),
  (6, 'BMD', '13:28', '13:30', FALSE, FALSE, 0),
  (7, 'PGC', '13:45', '13:50', FALSE, FALSE, 0),
  (8, 'KWN', '14:21', '14:24', FALSE, FALSE, 0),
  (9, 'RNG', '14:42', '14:45', FALSE, FALSE, 0),
  (10, 'BDG', '15:48', '15:58', FALSE, FALSE, 0),
  (11, 'PBP', '17:20', '17:35', FALSE, FALSE, 0),
  (12, 'DNJ', '18:00', '18:08', FALSE, FALSE, 0),
  (13, 'STB', '18:48', '18:50', FALSE, FALSE, 0),
  (14, 'PRJ', '19:06', '19:08', FALSE, FALSE, 0),
  (15, 'TKG', '19:38', '19:41', FALSE, FALSE, 0),
  (16, 'RHI', '20:00', '20:02', FALSE, FALSE, 0),
  (17, 'KSM', '20:12', '20:14', FALSE, FALSE, 0),
  (18, 'PCG', '20:40', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 768 — Dolonchapa Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'PCG'),
  destination_id = (SELECT id FROM stations WHERE code = 'STH'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '768';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '768');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '768'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'PCG', NULL, '06:00', TRUE, FALSE, 0),
  (2, 'KSM', '06:10', '06:12', FALSE, FALSE, 0),
  (3, 'RHI', '06:21', '06:23', FALSE, FALSE, 0),
  (4, 'TKG', '06:33', '06:35', FALSE, FALSE, 0),
  (5, 'PRJ', '06:51', '06:54', FALSE, FALSE, 0),
  (6, 'STB', '07:13', '07:15', FALSE, FALSE, 0),
  (7, 'DNJ', '07:25', '07:27', FALSE, FALSE, 0),
  (8, 'CRB', '07:43', '07:46', FALSE, FALSE, 0),
  (9, 'PBP', '08:21', '08:31', FALSE, FALSE, 0),
  (10, 'RNG', '10:35', '10:40', FALSE, FALSE, 0),
  (11, 'BMD', '11:42', '11:45', FALSE, FALSE, 0),
  (12, 'GBD', '12:04', '12:07', FALSE, FALSE, 0),
  (13, 'BNP2', '12:52', '12:57', FALSE, FALSE, 0),
  (14, 'BOG', '13:43', '15:05', FALSE, FALSE, 0),
  (15, 'STH', '16:15', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 779 — Dhalarchar Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'DLC'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[0, 1, 2, 3, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '779';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '779');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '779'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'DLC', NULL, '06:30', TRUE, FALSE, 0),
  (2, 'PBN', '08:16', '08:18', FALSE, FALSE, 0),
  (3, 'IWD', '09:12', '09:15', FALSE, FALSE, 0),
  (4, 'AZN', '09:24', '09:27', FALSE, FALSE, 0),
  (5, 'ALP', '09:38', '09:40', FALSE, FALSE, 0),
  (6, 'SDR', '09:56', '09:58', FALSE, FALSE, 0),
  (7, 'RAJ', '10:25', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 780 — Dhalarchar Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'DLC'),
  days_of_week   = ARRAY[0, 1, 2, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '780';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '780');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '780'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '17:20', TRUE, FALSE, 0),
  (2, 'SDR', '17:37', '17:39', FALSE, FALSE, 0),
  (3, 'ALP', '17:55', '17:57', FALSE, FALSE, 0),
  (4, 'AZN', '18:09', '18:11', FALSE, FALSE, 0),
  (5, 'IWD', '18:19', '18:21', FALSE, FALSE, 0),
  (6, 'PBN', '19:23', '19:25', FALSE, FALSE, 0),
  (7, 'DLC', '21:15', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 783 — Tungipara Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'GBR'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[0, 1, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '783';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '783');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '783'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'GBR', NULL, '06:30', TRUE, FALSE, 0),
  (2, 'IWD', '11:40', '12:00', FALSE, FALSE, 0),
  (3, 'AZN', '12:15', '12:17', FALSE, FALSE, 0),
  (4, 'RAJ', '13:15', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 784 — Tungipara Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'GBR'),
  days_of_week   = ARRAY[0, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '784';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '784');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '784'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '15:30', TRUE, FALSE, 0),
  (2, 'AZN', '16:30', '16:35', FALSE, FALSE, 0),
  (3, 'IWD', '16:40', '17:00', FALSE, FALSE, 0),
  (4, 'GBR', '22:10', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 791 — Banalata Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'DHKA'),
  destination_id = (SELECT id FROM stations WHERE code = 'CPN'),
  days_of_week   = ARRAY[0, 1, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '791';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '791');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '791'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'DHKA', NULL, '13:30', TRUE, FALSE, 0),
  (2, 'DABB', '13:53', '13:58', FALSE, FALSE, 0),
  (3, 'RAJ', '17:45', '18:05', FALSE, FALSE, 0),
  (4, 'CPN', '19:15', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 792 — Banalata Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'CPN'),
  destination_id = (SELECT id FROM stations WHERE code = 'DHKA'),
  days_of_week   = ARRAY[0, 1, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '792';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '792');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '792'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'CPN', NULL, '06:00', TRUE, FALSE, 0),
  (2, 'RAJ', '06:50', '07:00', FALSE, FALSE, 0),
  (3, 'DABB', '11:06', '11:09', FALSE, FALSE, 0),
  (4, 'DHKA', '11:35', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 803 — Banglabandha Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'RAJ'),
  destination_id = (SELECT id FROM stations WHERE code = 'PCG'),
  days_of_week   = ARRAY[0, 1, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '803';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '803');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '803'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'RAJ', NULL, '21:00', TRUE, FALSE, 0),
  (2, 'ALP', '21:40', '22:00', FALSE, FALSE, 0),
  (3, 'NTR', '22:17', '22:20', FALSE, FALSE, 0),
  (4, 'STH', '22:57', '22:59', FALSE, FALSE, 0),
  (5, 'JPH', '23:21', '23:25', FALSE, FALSE, 0),
  (6, 'PBP', '00:37', '00:40', FALSE, FALSE, 1),
  (7, 'DNJ', '00:58', '01:01', FALSE, FALSE, 1),
  (8, 'PRJ', '03:17', '03:19', FALSE, FALSE, 1),
  (9, 'TKG', '03:34', '03:36', FALSE, FALSE, 1),
  (10, 'RHI', '03:43', '03:47', FALSE, FALSE, 1),
  (11, 'KSM', '04:02', '04:04', FALSE, FALSE, 1),
  (12, 'PCG', '04:40', NULL, FALSE, TRUE, 1)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 804 — Banglabandha Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'PCG'),
  destination_id = (SELECT id FROM stations WHERE code = 'RAJ'),
  days_of_week   = ARRAY[0, 1, 2, 3, 4, 5]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '804';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '804');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '804'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'PCG', NULL, '09:00', TRUE, FALSE, 0),
  (2, 'KSM', '09:18', '09:20', FALSE, FALSE, 0),
  (3, 'RHI', '09:29', '09:31', FALSE, FALSE, 0),
  (4, 'TKG', '09:47', '09:50', FALSE, FALSE, 0),
  (5, 'DNJ', '10:34', '10:36', FALSE, FALSE, 0),
  (6, 'PBP', '12:00', '12:20', FALSE, FALSE, 0),
  (7, 'JPH', '13:07', '13:09', FALSE, FALSE, 0),
  (8, 'STH', '14:12', '14:14', FALSE, FALSE, 0),
  (9, 'NTR', '15:07', '15:09', FALSE, FALSE, 0),
  (10, 'ALP', '15:35', '15:55', FALSE, FALSE, 0),
  (11, 'RAJ', '17:15', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 827 — Ruposhi Bangla Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'BNP'),
  destination_id = (SELECT id FROM stations WHERE code = 'DHKA'),
  days_of_week   = ARRAY[0, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '827';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '827');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '827'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'BNP', NULL, '15:25', TRUE, FALSE, 0),
  (2, 'JS', '16:12', '16:15', FALSE, FALSE, 0),
  (3, 'NRL', '16:43', '16:46', FALSE, FALSE, 0),
  (4, 'KSY', '17:08', '17:11', FALSE, FALSE, 0),
  (5, 'BNG', '17:44', '17:47', FALSE, FALSE, 0),
  (6, 'DHKA', '19:00', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

-- ── Train 828 — Ruposhi Bangla Express ──────────────────────────
UPDATE trains SET
  origin_id      = (SELECT id FROM stations WHERE code = 'DHKA'),
  destination_id = (SELECT id FROM stations WHERE code = 'BNP'),
  days_of_week   = ARRAY[0, 2, 3, 4, 5, 6]::smallint[],
  last_verified  = '2026-06-19',
  notes          = 'Route corrected from official BR PDF (train_stops.json, VERIFIED_PDF tier) during bulk reconciliation. trains.json origin/destination were wrong.'
WHERE number = '828';

DELETE FROM train_stops WHERE train_id = (SELECT id FROM trains WHERE number = '828');

INSERT INTO train_stops (train_id, station_id, sequence, arrival_time, departure_time, is_origin, is_destination, day_offset)
SELECT (SELECT id FROM trains WHERE number = '828'), s.id, v.sequence, v.arrival_time::time, v.departure_time::time, v.is_origin, v.is_destination, v.day_offset
FROM (VALUES
  (1, 'DHKA', NULL, '10:45', TRUE, FALSE, 0),
  (2, 'BNG', '11:47', '11:50', FALSE, FALSE, 0),
  (3, 'KSY', '12:19', '12:22', FALSE, FALSE, 0),
  (4, 'NRL', '12:42', '12:45', FALSE, FALSE, 0),
  (5, 'JS', '13:15', '13:25', FALSE, FALSE, 0),
  (6, 'BNP', '14:25', NULL, FALSE, TRUE, 0)
) AS v(sequence, station_code, arrival_time, departure_time, is_origin, is_destination, day_offset)
JOIN stations s ON s.code = v.station_code;

COMMIT;
