import { mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const INSTALLER_TEMP_DIR = join(
  tmpdir(),
  'thijar-installer-uploads',
);

export function ensureInstallerTempDirectory(): string {
  mkdirSync(INSTALLER_TEMP_DIR, { recursive: true });

  return INSTALLER_TEMP_DIR;
}