/**
 * Creates the first admin account (there is no public sign-up).
 *
 *   npm run create-admin -- --email you@example.com --name "Your Name"
 *
 * The password is typed at a hidden prompt, so it never lands in your shell history.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index > -1 ? process.argv[index + 1] : undefined;
}

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    let muted = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyRl = rl as any;
    const write = anyRl._writeToOutput.bind(rl);
    anyRl._writeToOutput = (text: string) => {
      if (!muted) write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    muted = true; // hide what is typed after the prompt has been shown
  });
}

async function main() {
  const email = readArg('--email')?.trim().toLowerCase();
  const name = readArg('--name')?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run create-admin -- --email you@example.com --name "Your Name"');
    process.exit(1);
  }

  const password = await askHidden('Password: ');
  const confirm = await askHidden('Repeat password: ');

  if (password !== confirm) {
    console.error('The passwords do not match.');
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    console.error('The password is too long (bcrypt reads only the first 72 bytes).');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      console.error(`An admin with ${email} already exists.`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const admin = await prisma.adminUser.create({
      data: { email, name, passwordHash },
    });
    console.log(`Admin created: ${admin.email} (${admin.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});