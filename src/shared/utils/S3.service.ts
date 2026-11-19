import { BadRequestException, Body, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import {DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

import { fileTypeFromBuffer } from 'file-type';
import { createReadStream } from "fs";

// A signed link stays valid for 7 days, the longest S3 allows for access keys
const SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class S3Service {
    private readonly s3Client : S3Client;
    private readonly bucketName : string | undefined;
    
    constructor() {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const region = process.env.AWS_REGION;
        const bucketName = process.env.AWS_S3_BUCKETNAME;
        if(!accessKeyId||!secretAccessKey||!region||!bucketName){
            throw new Error('Missing AWS credentials or region in environment variables')
        }
        this.s3Client = new S3Client({
            region: region,
            credentials :{
                accessKeyId:accessKeyId,
                secretAccessKey:secretAccessKey
            },
        });
        this.bucketName=bucketName;
    }
    
    private generateFileName(bytes=6):string {
        return `WEB-${crypto.randomBytes(bytes).toString("hex")}`
    }

    private generateInstallerFileName(): string {
      return `ERP-${crypto.randomBytes(6).toString('hex')}.exe`;
    }

    private async validateImage(file: Express.Multer.File){
      const detectedType = await fileTypeFromBuffer(file.buffer)

      if(!detectedType || !['image/png', 'image/jpeg', 'image/webp' ].includes(detectedType.mime)){
        throw new BadRequestException("Unsupported image format")
      }
      return detectedType
    }

    async uploadImage(file: Express.Multer.File) {
        if(!file||!file.buffer||!file.mimetype){
            throw new BadRequestException("Invalid File Input"); 
        }
        const detectedType = await this.validateImage(file)

        const imageName = this.generateFileName()
        const params = {
            Bucket: this.bucketName,
            Key: imageName,
            Body: file.buffer,
            ContentType: detectedType.mime
        }

        try{
            await this.s3Client.send(new PutObjectCommand(params))
            return imageName;
        }
        catch(error){
          console.log("S3 Upload error",error)
          throw new InternalServerErrorException('Failed to upload the file')
        }
    }

    async getSignedUrlObject(key: string): Promise<string> {
        if (!key) {
          throw new BadRequestException('No image key provided');
        }
    
        const params = {
          Bucket: this.bucketName,
          Key: key,
        };

    
        try {
          const command = new GetObjectCommand(params);
          return await getSignedUrl(this.s3Client, command, {
            expiresIn: SIGNED_URL_EXPIRY_SECONDS,
          });
        } catch (error) {
          console.error('Signed URL Error:', error instanceof Error ? error.message : error);
          throw new InternalServerErrorException('Could not generate signed URL');
        }
      }


      async deleteObject(key:string): Promise<void> {
        if (!key) {
            throw new InternalServerErrorException('No image key provided');
          }
      
          const params = {
            Bucket: this.bucketName,
            Key: key,
          };
      
          try {
            const command = new DeleteObjectCommand(params);
            await this.s3Client.send(command);
          } catch (error) {
            console.error('Object Delete Error', error instanceof Error ? error.message : error);
            throw new InternalServerErrorException('Could not delete file from s3');
          }
      }


      async uploadInstallerFromDisk(filePath: string): Promise<string> {
        const fileKey = this.generateInstallerFileName();
      
        const upload = new Upload({
          client: this.s3Client,
          params: {
            Bucket: this.bucketName,
            Key: fileKey,
            Body: createReadStream(filePath),
            ContentType: 'application/vnd.microsoft.portable-executable',
            ContentDisposition: 'attachment; filename="ERP-Setup.exe"',
          },
          leavePartsOnError:false
        });
      
        try {
          await upload.done();
          return fileKey;
        } catch (error) {
          console.error('S3 installer upload error:', error);
          throw new InternalServerErrorException('Failed to upload installer to S3');
        }
      }

      async getInstallerDownloadUrl(key: string): Promise<string> {
        if (!key) {
          throw new BadRequestException('No installer key provided');
        }
      
        try {
          const command = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          });
      
          return await getSignedUrl(this.s3Client, command, {
            expiresIn: 5 * 60,
          });
        } catch (error) {
          console.error('Installer download URL error:', error);
          throw new InternalServerErrorException(
            'Could not generate installer download URL',
          );
        }
      }
}