// Generate hash argon2id untuk AUTH_PASSWORD_HASH.
// Pakai: bun scripts/hash-password.js '<password>'
import { hash } from '@node-rs/argon2';

const pw = process.argv[2];
if (!pw) {
	console.error("Pakai: bun scripts/hash-password.js '<password>'");
	process.exit(1);
}

console.log(await hash(pw));
