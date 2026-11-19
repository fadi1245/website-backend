import {
    BadRequestException,
  } from '@nestjs/common';
  import {
    createReadStream,
  } from 'fs';
  import {
    open,
    stat,
  } from 'fs/promises';
  import { extname } from 'path';
  import { createHash } from 'crypto';
  
  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
  
  export interface InstallerValidationResult {
    sizeBytes: number;
    checksumSha256: string;
  }
  
  export async function validateInstallerFile(
    file: Express.Multer.File,
  ): Promise<InstallerValidationResult> {
    // 1. Ensure Multer provided a file
    if (!file || !file.path) {
      throw new BadRequestException('No installer file was received');
    }
  
    // 2. Ensure the temporary file actually exists
    let fileStats;
  
    try {
      fileStats = await stat(file.path);
    } catch {
      throw new BadRequestException('Temporary installer file does not exist');
    }
  
    // 3. Validate file size
    if (!fileStats.isFile()) {
      throw new BadRequestException('Uploaded path is not a file');
    }
  
    if (fileStats.size <= 0) {
      throw new BadRequestException('Installer file is empty');
    }
  
    if (fileStats.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        'Installer exceeds the maximum allowed size',
      );
    }
  
    // 4. Validate original filename extension
    if (extname(file.originalname).toLowerCase() !== '.exe') {
      throw new BadRequestException('Only .exe files are allowed');
    }
  
    // 5. Validate Windows executable structure (MZ + PE signatures)
    const fileHandle = await open(file.path, 'r');
  
    try {
      // Read the DOS header
      const dosHeader = Buffer.alloc(64);
  
      const { bytesRead } = await fileHandle.read(
        dosHeader,
        0,
        dosHeader.length,
        0,
      );
  
      if (bytesRead < 64) {
        throw new BadRequestException('Invalid or incomplete executable file');
      }
  
      // MZ signature: first two bytes must be 4D 5A
      if (
        dosHeader[0] !== 0x4d ||
        dosHeader[1] !== 0x5a
      ) {
        throw new BadRequestException(
          'Invalid Windows executable signature',
        );
      }
  
      // e_lfanew: location of the PE header
      const peOffset = dosHeader.readUInt32LE(0x3c);
  
      // Ensure the PE header position is within the file
      if (
        peOffset < 64 ||
        peOffset > fileStats.size - 4
      ) {
        throw new BadRequestException(
          'Invalid executable header offset',
        );
      }
  
      // Read the PE signature at the specified offset
      const peSignature = Buffer.alloc(4);
  
      const peRead = await fileHandle.read(
        peSignature,
        0,
        4,
        peOffset,
      );
  
      if (peRead.bytesRead !== 4) {
        throw new BadRequestException(
          'Unable to read executable header',
        );
      }
  
      // PE signature: 50 45 00 00 ("PE\0\0")
      if (!peSignature.equals(Buffer.from([0x50, 0x45, 0x00, 0x00]))) {
        throw new BadRequestException(
          'Invalid Windows PE executable structure',
        );
      }
    } finally {
      await fileHandle.close();
    }
  
    // 6. Calculate SHA-256 of the actual file contents
    const checksumSha256 = await calculateSha256(file.path);
  
    // Return validated metadata
    return {
      sizeBytes: fileStats.size,
      checksumSha256,
    };
  }
  
  function calculateSha256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
  
      stream.on('data', (chunk) => {
        hash.update(chunk);
      });
  
      stream.on('error', (error) => {
        reject(error);
      });
  
      stream.on('end', () => {
        resolve(hash.digest('hex'));
      });
    });
  }