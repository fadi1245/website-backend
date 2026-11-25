
import {
    BadRequestException,
  } from '@nestjs/common';
  
  import { memoryStorage } from 'multer';
  
  export const applicationUploadOptions = {
    storage: memoryStorage(),
  
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
      files: 1,
    },
  
    fileFilter: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (
        file.mimetype !== 'application/pdf' ||
        !file.originalname.toLowerCase().endsWith('.pdf')
      ) {
        return callback(
          new BadRequestException('Only PDF files are allowed'),
          false,
        );
      }
  
      callback(null, true);
    },
  };
  