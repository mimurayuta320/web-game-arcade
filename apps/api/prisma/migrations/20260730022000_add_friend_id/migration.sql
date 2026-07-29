SET @has_friend_id_col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'friend_id'
);

SET @add_friend_id_sql := IF(
  @has_friend_id_col = 0,
  'ALTER TABLE users ADD COLUMN friend_id VARCHAR(24) NOT NULL DEFAULT ''''',
  'SELECT 1'
);
PREPARE add_friend_id_stmt FROM @add_friend_id_sql;
EXECUTE add_friend_id_stmt;
DEALLOCATE PREPARE add_friend_id_stmt;

UPDATE users
SET friend_id = CONCAT('F', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 11)))
WHERE friend_id IS NULL OR friend_id = '';

SET @has_friend_id_index := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'uidx_users_friend_id'
);

SET @create_friend_id_idx_sql := IF(
  @has_friend_id_index = 0,
  'CREATE UNIQUE INDEX uidx_users_friend_id ON users(friend_id)',
  'SELECT 1'
);
PREPARE create_friend_id_idx_stmt FROM @create_friend_id_idx_sql;
EXECUTE create_friend_id_idx_stmt;
DEALLOCATE PREPARE create_friend_id_idx_stmt;
