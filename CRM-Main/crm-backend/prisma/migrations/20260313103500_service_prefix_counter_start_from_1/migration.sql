-- Use 01, 02, ... instead of 1001, 1002, ...

-- Alter defaults for new rows
ALTER TABLE "shop_settings"
ALTER COLUMN "project_counter" SET DEFAULT 1,
ALTER COLUMN "client_counter" SET DEFAULT 1;

-- Convert legacy counters (1001 -> 1, 1002 -> 2, ...)
UPDATE "shop_settings"
SET
  "project_counter" = CASE
    WHEN "project_counter" >= 1000 THEN GREATEST(1, "project_counter" - 1000)
    ELSE "project_counter"
  END,
  "client_counter" = CASE
    WHEN "client_counter" >= 1000 THEN GREATEST(1, "client_counter" - 1000)
    ELSE "client_counter"
  END;

-- Convert legacy IDs like PRJ-1004 -> PRJ-04 and CLT-1004 -> CLT-04 (only when safe)
WITH legacy_clients AS (
  SELECT
    c."id",
    c."shopId",
    regexp_replace(c."clientId", '\\d+$', '') AS prefix_part,
    (regexp_replace(c."clientId", '\\D', '', 'g'))::int AS num_part
  FROM "service_clients" c
  WHERE c."clientId" ~ '\\d+$'
),
client_updates AS (
  SELECT
    lc."id",
    (lc.prefix_part || lpad((lc.num_part - 1000)::text, 2, '0')) AS new_id
  FROM legacy_clients lc
  WHERE lc.num_part >= 1000
    AND NOT EXISTS (
      SELECT 1
      FROM "service_clients" c2
      WHERE c2."shopId" = lc."shopId"
        AND c2."clientId" = (lc.prefix_part || lpad((lc.num_part - 1000)::text, 2, '0'))
    )
)
UPDATE "service_clients" c
SET "clientId" = u.new_id
FROM client_updates u
WHERE c."id" = u."id";

WITH legacy_projects AS (
  SELECT
    p."id",
    p."shopId",
    regexp_replace(p."projectId", '\\d+$', '') AS prefix_part,
    (regexp_replace(p."projectId", '\\D', '', 'g'))::int AS num_part
  FROM "service_projects" p
  WHERE p."projectId" ~ '\\d+$'
),
project_updates AS (
  SELECT
    lp."id",
    (lp.prefix_part || lpad((lp.num_part - 1000)::text, 2, '0')) AS new_id
  FROM legacy_projects lp
  WHERE lp.num_part >= 1000
    AND NOT EXISTS (
      SELECT 1
      FROM "service_projects" p2
      WHERE p2."shopId" = lp."shopId"
        AND p2."projectId" = (lp.prefix_part || lpad((lp.num_part - 1000)::text, 2, '0'))
    )
)
UPDATE "service_projects" p
SET "projectId" = u.new_id
FROM project_updates u
WHERE p."id" = u."id";

