// Print SQL that copies the old JSON accounts (server/data/profiles.json) into the API's `users` table.
// The old scrypt salt/hash are kept as-is: the API accepts them at login and upgrades them to bcrypt.
//
//   node scripts/import-legacy-profiles.mjs [path/to/profiles.json] | docker exec -i web-game-mysql mariadb -u <user> -p<password> web_game
//
// Existing accounts are never overwritten (INSERT IGNORE). User IDs that differ only by case
// (the DB compares them case-insensitively) are imported once; the extra ones are listed on stderr.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = process.argv[2] || path.join(here, "..", "server", "data", "profiles.json");
const data = JSON.parse(fs.readFileSync(source, "utf8"));

const hex = (text) => `X'${Buffer.from(String(text), "utf8").toString("hex")}'`;
const int = (value, fallback) => (Number.isFinite(Number(value)) ? Math.floor(Number(value)) : fallback);

const seen = new Set();
const usedFriendIds = new Set();
const friendId = () => {
  for (;;) {
    const id = `F${crypto.randomBytes(6).toString("hex").toUpperCase().slice(0, 11)}`;
    if (!usedFriendIds.has(id)) {
      usedFriendIds.add(id);
      return id;
    }
  }
};

const now = Date.now();
const statements = ["SET NAMES utf8mb4;"];
let imported = 0;
for (const [userId, raw] of Object.entries(data.users || {})) {
  const key = userId.toLowerCase();
  if (userId.length > 24 || !raw?.passSaltHex || !raw?.passHashHex) {
    console.error(`skipped ${userId}: no legacy password data or ID too long`);
    continue;
  }
  if (seen.has(key)) {
    console.error(`skipped ${userId}: same ID as another account when case is ignored`);
    continue;
  }
  seen.add(key);
  const createdAt = int(raw.createdAt, now);
  statements.push(
    "INSERT IGNORE INTO users (user_id, friend_id, pass_hash_bcrypt, pass_salt_hex, pass_hash_hex, profile_json, created_at, updated_at) VALUES "
    + `(${hex(userId)}, ${hex(friendId())}, '', ${hex(raw.passSaltHex)}, ${hex(raw.passHashHex)}, ${hex(JSON.stringify(raw.profile ?? {}))}, ${createdAt}, ${int(raw.updatedAt, createdAt)});`,
  );
  imported += 1;
}
console.error(`prepared ${imported} account(s) from ${path.basename(source)}`);
console.log(statements.join("\n"));
