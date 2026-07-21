-- Open server/data/a5m2.test.sqlite in a SQLite extension and run these.

-- 1) list tables
SELECT name
FROM sqlite_master
WHERE type = 'table'
ORDER BY name;

-- 2) users schema
PRAGMA table_info(users);

-- 3) friends schema
PRAGMA table_info(friends);

-- 4) recent users
SELECT user_id, datetime(updated_at / 1000, 'unixepoch', 'localtime') AS updated_local
FROM users
ORDER BY updated_at DESC
LIMIT 20;

-- 5) friends list with count
SELECT user_id, COUNT(*) AS friend_count
FROM friends
GROUP BY user_id
ORDER BY friend_count DESC, user_id ASC;

-- 6) recent match records
SELECT id, user_id, game, result, room_code, opponent,
       datetime(played_at / 1000, 'unixepoch', 'localtime') AS played_local
FROM match_records
ORDER BY played_at DESC
LIMIT 20;
