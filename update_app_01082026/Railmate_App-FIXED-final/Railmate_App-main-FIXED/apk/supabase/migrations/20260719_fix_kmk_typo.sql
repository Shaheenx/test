-- Fix station name typo carried over from original seed
UPDATE stations SET name_en = 'Kamarkhali' WHERE code = 'KMK' AND name_en = 'Kmarkhali';
SELECT code, name_en FROM stations WHERE code = 'KMK';
