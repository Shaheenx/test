-- ============================================================
-- Populate trains.origin_id and trains.destination_id from train_stops
-- ============================================================
-- Problem: All trains have origin_id=NULL and destination_id=NULL, causing
-- search to return zero results. This migration derives the origin/destination
-- from the first and last stops in train_stops (ordered by sequence).

-- Step 1: Verify train_stops has data
-- If this returns 0, the database needs full seeding (trains + stops + fares)
DO $$
DECLARE
  stop_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO stop_count FROM train_stops;
  RAISE NOTICE 'train_stops has % rows', stop_count;

  IF stop_count = 0 THEN
    RAISE EXCEPTION 'train_stops table is empty. Run seed.sql or parse-br-pdf.py first.';
  END IF;
END $$;

-- Step 2: Update trains.origin_id from the FIRST stop (min sequence)
UPDATE trains t
SET origin_id = (
  SELECT ts.station_id
  FROM train_stops ts
  WHERE ts.train_id = t.id
  ORDER BY ts.sequence ASC
  LIMIT 1
)
WHERE t.origin_id IS NULL;

-- Step 3: Update trains.destination_id from the LAST stop (max sequence)
UPDATE trains t
SET destination_id = (
  SELECT ts.station_id
  FROM train_stops ts
  WHERE ts.train_id = t.id
  ORDER BY ts.sequence DESC
  LIMIT 1
)
WHERE t.destination_id IS NULL;

-- Step 4: Verify the fix worked
DO $$
DECLARE
  null_origin_count INTEGER;
  null_dest_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_origin_count FROM trains WHERE origin_id IS NULL;
  SELECT COUNT(*) INTO null_dest_count FROM trains WHERE destination_id IS NULL;

  RAISE NOTICE 'After update: % trains still have NULL origin_id', null_origin_count;
  RAISE NOTICE 'After update: % trains still have NULL destination_id', null_dest_count;

  IF null_origin_count > 0 OR null_dest_count > 0 THEN
    RAISE WARNING 'Some trains still have NULL origin/destination. Check if train_stops has data for all trains.';
  ELSE
    RAISE NOTICE 'SUCCESS: All trains now have origin_id and destination_id populated!';
  END IF;
END $$;
