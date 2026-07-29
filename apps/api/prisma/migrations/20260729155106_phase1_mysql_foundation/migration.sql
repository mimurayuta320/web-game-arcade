-- CreateTable
CREATE TABLE `users` (
    `user_id` VARCHAR(24) NOT NULL,
    `pass_hash_bcrypt` VARCHAR(255) NOT NULL,
    `created_at` BIGINT NOT NULL,
    `updated_at` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles` (
    `user_id` VARCHAR(24) NOT NULL,
    `player_name` VARCHAR(18) NOT NULL,
    `profile_bio` VARCHAR(180) NOT NULL DEFAULT '',
    `player_avatar` MEDIUMTEXT NOT NULL DEFAULT '',
    `bank_coins` INTEGER NOT NULL DEFAULT 0,
    `pity_counter` INTEGER NOT NULL DEFAULT 0,
    `selected_skin` VARCHAR(64) NOT NULL DEFAULT 'classic',
    `unlocked_skins_json` JSON NOT NULL,
    `match_stats_json` JSON NOT NULL,
    `fit_puzzle_progress_json` JSON NOT NULL,
    `created_at` BIGINT NOT NULL,
    `updated_at` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `session_id` CHAR(36) NOT NULL,
    `user_id` VARCHAR(24) NOT NULL,
    `created_at` BIGINT NOT NULL,
    `last_seen_at` BIGINT NOT NULL,

    UNIQUE INDEX `auth_sessions_user_id_key`(`user_id`),
    INDEX `idx_auth_sessions_last_seen`(`last_seen_at` DESC),
    PRIMARY KEY (`session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scores` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(24) NULL,
    `player_name` VARCHAR(18) NOT NULL,
    `score` INTEGER NOT NULL,
    `game` VARCHAR(24) NULL,
    `created_at` BIGINT NOT NULL,

    INDEX `idx_scores_created`(`created_at` DESC),
    INDEX `idx_scores_game_created`(`game`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(24) NOT NULL,
    `game` VARCHAR(24) NOT NULL,
    `result` ENUM('win', 'lose', 'draw') NOT NULL,
    `room_code` VARCHAR(6) NOT NULL DEFAULT '',
    `opponent` VARCHAR(18) NOT NULL DEFAULT 'Player',
    `played_at` BIGINT NOT NULL,

    INDEX `idx_match_records_user_time`(`user_id`, `played_at` DESC),
    INDEX `idx_match_records_game_time`(`game`, `played_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friends` (
    `user_id` VARCHAR(24) NOT NULL,
    `friend_user_id` VARCHAR(24) NOT NULL,
    `created_at` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`, `friend_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friend_requests` (
    `requester_user_id` VARCHAR(24) NOT NULL,
    `target_user_id` VARCHAR(24) NOT NULL,
    `created_at` BIGINT NOT NULL,

    INDEX `idx_friend_requests_target`(`target_user_id`, `created_at` DESC),
    PRIMARY KEY (`requester_user_id`, `target_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friend_messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `sender_user_id` VARCHAR(24) NOT NULL,
    `receiver_user_id` VARCHAR(24) NOT NULL,
    `message` VARCHAR(400) NOT NULL,
    `created_at` BIGINT NOT NULL,

    INDEX `idx_friend_messages_pair_time`(`sender_user_id`, `receiver_user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friend_chat_reads` (
    `user_id` VARCHAR(24) NOT NULL,
    `friend_user_id` VARCHAR(24) NOT NULL,
    `last_read_message_id` BIGINT NOT NULL,
    `updated_at` BIGINT NOT NULL,

    PRIMARY KEY (`user_id`, `friend_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inquiries` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(24) NULL,
    `name` VARCHAR(36) NOT NULL,
    `message` VARCHAR(200) NOT NULL,
    `url` VARCHAR(240) NOT NULL DEFAULT '',
    `lang` VARCHAR(2) NOT NULL,
    `submitted_at` BIGINT NOT NULL,

    INDEX `idx_inquiries_submitted`(`submitted_at` DESC),
    INDEX `idx_inquiries_user_time`(`user_id`, `submitted_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scores` ADD CONSTRAINT `scores_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friends` ADD CONSTRAINT `friends_friend_user_id_fkey` FOREIGN KEY (`friend_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_requester_user_id_fkey` FOREIGN KEY (`requester_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_requests` ADD CONSTRAINT `friend_requests_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_messages` ADD CONSTRAINT `friend_messages_sender_user_id_fkey` FOREIGN KEY (`sender_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_messages` ADD CONSTRAINT `friend_messages_receiver_user_id_fkey` FOREIGN KEY (`receiver_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_chat_reads` ADD CONSTRAINT `friend_chat_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friend_chat_reads` ADD CONSTRAINT `friend_chat_reads_friend_user_id_fkey` FOREIGN KEY (`friend_user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inquiries` ADD CONSTRAINT `inquiries_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
