import { BadRequestException, Body, Injectable, InternalServerErrorException } from "@nestjs/common";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { fileTypeFromBuffer } from 'file-type';

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
    
    private generateImageName(bytes=6):string {
        return `WEB-${crypto.randomBytes(bytes).toString("hex")}`
    }

    async uploadObject(file: Express.Multer.File) {
        if(!file||!file.buffer||!file.mimetype){
            throw new BadRequestException("Invalid File Input"); 
        }
        const detectedType = await fileTypeFromBuffer(file.buffer);
        if(!detectedType || !['image/png', 'image/jpeg', 'image/webp' ].includes(detectedType.mime)){
            throw new BadRequestException("Unsupported image Format")
        }
        const imageName = this.generateImageName()
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

    /**
     * Temporary link that lets a browser read one private file.
     * The link is signed with the start of today (UTC) instead of the current moment,
     * so every call during the same day returns the SAME link. That lets browsers
     * keep the image in their cache instead of downloading it again each time.
     */
    async getSignedUrlObject(key: string): Promise<string> {
        if (!key) {
          throw new InternalServerErrorException('No image key provided');
        }
    
        const params = {
          Bucket: this.bucketName,
          Key: key,
        };

        const signingDate = new Date();
        signingDate.setUTCHours(0, 0, 0, 0);
    
        try {
          const command = new GetObjectCommand(params);
          return await getSignedUrl(this.s3Client, command, {
            expiresIn: SIGNED_URL_EXPIRY_SECONDS,
            signingDate,
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
}