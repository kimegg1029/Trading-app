import bcrypt from 'bcryptjs';
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: node server/hash-password.js "at-least-12-character-password"');
  process.exit(1);
}
console.log(await bcrypt.hash(password, 12));
