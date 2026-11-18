-- Starter meats (idempotent on name_key)
INSERT INTO meats (id, name, name_key)
SELECT lower(hex(randomblob(16))), v.name, v.key
FROM (SELECT 'Brisket' AS name, 'brisket' AS key UNION ALL SELECT 'Pulled Pork' AS name, 'pulledpork' AS key UNION ALL SELECT 'Beer Can Chicken' AS name, 'beercanchicken' AS key UNION ALL SELECT 'St. Louis Ribs' AS name, 'stlouisribs' AS key UNION ALL SELECT 'Baby Back Ribs' AS name, 'babybackribs' AS key UNION ALL SELECT 'Turkey' AS name, 'turkey' AS key UNION ALL SELECT 'Tri-tip' AS name, 'tritip' AS key UNION ALL SELECT 'New York Strips' AS name, 'newyorkstrips' AS key UNION ALL SELECT 'Ribeyes' AS name, 'ribeyes' AS key) v
WHERE NOT EXISTS (SELECT 1 FROM meats m WHERE m.name_key = v.key);
--> statement-breakpoint
-- Meats for existing cooks, from protein, else cut, else name
INSERT INTO meats (id, name, name_key)
SELECT lower(hex(randomblob(16))), src, key
FROM (
  SELECT coalesce(nullif(trim(protein), ''), nullif(trim(cut), ''), nullif(trim(name), '')) AS src, replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(coalesce(nullif(trim(protein), ''), nullif(trim(cut), ''), nullif(trim(name), ''))), ' ', ''), '-', ''), '''', ''), '.', ''), ',', ''), '/', ''), '_', ''), '&', ''), '(', ''), ')', ''), '"', ''), '!', '') AS key
  FROM cooks
  WHERE meat_id IS NULL AND coalesce(nullif(trim(protein), ''), nullif(trim(cut), ''), nullif(trim(name), '')) IS NOT NULL
  GROUP BY key
) c
WHERE c.key <> '' AND NOT EXISTS (SELECT 1 FROM meats m WHERE m.name_key = c.key);
--> statement-breakpoint
-- Columns are qualified: `meats` also has a `name` column that would shadow cooks.name here
UPDATE cooks
SET meat_id = (SELECT m.id FROM meats m WHERE m.name_key = replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(coalesce(nullif(trim(cooks.protein), ''), nullif(trim(cooks.cut), ''), nullif(trim(cooks.name), ''))), ' ', ''), '-', ''), '''', ''), '.', ''), ',', ''), '/', ''), '_', ''), '&', ''), '(', ''), ')', ''), '"', ''), '!', ''))
WHERE meat_id IS NULL AND coalesce(nullif(trim(cooks.protein), ''), nullif(trim(cooks.cut), ''), nullif(trim(cooks.name), '')) IS NOT NULL;
--> statement-breakpoint
-- Anything still unassigned gets a placeholder
INSERT INTO meats (id, name, name_key)
SELECT lower(hex(randomblob(16))), 'Unknown', 'unknown'
WHERE EXISTS (SELECT 1 FROM cooks WHERE meat_id IS NULL)
  AND NOT EXISTS (SELECT 1 FROM meats WHERE name_key = 'unknown');
--> statement-breakpoint
UPDATE cooks SET meat_id = (SELECT id FROM meats WHERE name_key = 'unknown') WHERE meat_id IS NULL;
