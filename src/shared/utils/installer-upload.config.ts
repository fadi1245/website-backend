import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { ensureInstallerTempDirectory } from './installer-temp-storage';

export const installerUploadOptions = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      const directory = ensureInstallerTempDirectory();
      callback(null, directory);
    },

    filename: (_req, _file, callback) => {
      const uniqueName = randomBytes(16).toString('hex');
      callback(null, `${uniqueName}.tmp`);
    },
  }),

  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 1,
  },
};