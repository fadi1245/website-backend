import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { S3Service } from '../../shared/utils/S3.service';
import { PrismaService } from 'src/database/prisma.service';
import { UpdateInstallerDto, UploadInstallerDto } from './dtos/create-installer.dto';
import { validateInstallerFile } from 'src/shared/utils/installer-validation';
import { CreateWebDto } from './dtos/create-web.dto';

@Injectable()
export class ErpDetailsService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
  ) {}

  async uploadInstaller(file: Express.Multer.File, dto: UploadInstallerDto) {
    // 1. Validate installer and calculate checksum
    const validationResult = await validateInstallerFile(file);

    // 2. Upload installer to S3
    const fileKey = await this.s3Service.uploadInstallerFromDisk(file.path);

    try {
      // 3. Save release record to PostgreSQL
      const release = await this.prisma.eRPInstallerRelease.create({
        data: {
          version: dto.version,
          fileName: file.originalname,
          fileKey,
          sizeBytes: validationResult.sizeBytes,
          checksumSha256: validationResult.checksumSha256,
          isActive: false,
        },
      });

      return {
        message: 'Installer uploaded successfully',
        release,
      };
    } catch (error) {
      // 4. DB failed after S3 upload — remove the S3 object
      try {
        await this.s3Service.deleteObject(fileKey);
      } catch (cleanupError) {
        console.error(
          'Failed to cleanup S3 installer after database failure:',
          fileKey,
          cleanupError,
        );
      }

      throw error;
    }
  }

  async getInstaller() {
    const installer = await this.prisma.eRPInstallerRelease.findFirst({
      select: {
        id: true,
        fileName: true,
        version: true,
        sizeBytes: true,
        uploadedAt: true,
      },
    });

    return {
      installer,
    };
  }

  async deleteInstaller() {
    const installer = await this.prisma.eRPInstallerRelease.findFirst({
      select: {
        id: true,
        fileKey: true,
      },
    });

    if (!installer) {
      throw new NotFoundException('Installer not found');
    }

    // 1. Delete installer from S3
    await this.s3Service.deleteObject(installer.fileKey);

    // 2. Delete installer record from PostgreSQL
    try {
      await this.prisma.eRPInstallerRelease.delete({
        where: {
          id: installer.id,
        },
      });
    } catch (error) {
      console.error(
        'S3 object deleted, but PostgreSQL installer record deletion failed:',
        installer.id,
        error,
      );

      throw new InternalServerErrorException(
        'Installer file was deleted from storage, but its database record could not be deleted',
      );
    }

    return {
      message: 'Installer deleted successfully',
    };
  }

  async updateInstaller(
    id: string,
    dto: UpdateInstallerDto,
  ) {
    const installer = await this.prisma.eRPInstallerRelease.findUnique({
      where: {
        id,
      },
    });
  
    if (!installer) {
      throw new NotFoundException('Installer not found');
    }
  
    const updatedInstaller = await this.prisma.eRPInstallerRelease.update({
      where: {
        id,
      },
      data: {
        version: dto.version,
      },
      select: {
        id: true,
        fileName: true,
        version: true,
        sizeBytes: true,
        uploadedAt: true,
      },
    });
  
    return {
      message: 'Installer version updated successfully',
      installer: updatedInstaller,
    };
  }

  async getInstallerDownloadUrl(): Promise<string> {
    const installer = await this.prisma.eRPInstallerRelease.findFirst({
      select: {
        fileKey: true,
      },
    });
  
    if (!installer) {
      throw new NotFoundException('Installer not found');
    }
  
    return this.s3Service.getInstallerDownloadUrl(installer.fileKey);
  }

  async createWebLink(dto: CreateWebDto){
    try{
      const WebLink = await this.prisma.siteSetting.upsert({
        where : {
          key: 'thijar_web',
        },
        create: {
          key: 'thijar_web',
          value: dto.WebLink,
        },
        update:{
          value : dto.WebLink
        }
      })
      return {
        message:'Web link added successfuly',
        WebLink
      }
    }
    catch(error){
      console.log(error)
      throw new InternalServerErrorException("Failed to save web link")
    }
  }

  async getWebLink() {
    const webLink = await this.prisma.siteSetting.findUnique({
      where: {
        key: 'thijar_web',
      },
      select: {
        value: true,
        updatedAt: true,
      },
    });
  
    if (!webLink) {
      throw new NotFoundException('Web link not found');
    }
  
    return {
      webLink: webLink.value,
      updatedAt: webLink.updatedAt,
    };
  }
}
