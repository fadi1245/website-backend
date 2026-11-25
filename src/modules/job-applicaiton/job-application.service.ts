import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { S3Service } from 'src/shared/utils/S3.service';
import { ApplicationQueryDto, CreateApplicationDto } from './dtos/job-application.dto';
import { PaginationService, SortField } from 'src/shared/utils/pagination.service';

const APPLICATIONS_ORDER: SortField[] = [
    { field: 'appliedAt', direction: 'desc', type: 'date' },
    { field: 'id', direction: 'desc', type: 'string' },
  ];
@Injectable()
export class JobApplicationService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
  ) {}

  async createApplication(
    file: Express.Multer.File,
    dto: CreateApplicationDto,
  ) {
    // 1. Check whether a CV was provided
    if (!file) {
      throw new BadRequestException('CV is required');
    }

    // 2. Find the job listing
    const job = await this.prisma.job.findUnique({
      where: {
        id: dto.jobId,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Job listing not found');
    }

    // 3. Check whether the job is open
    if (job.status !== 'open') {
      throw new BadRequestException(
        'Applications are not currently accepted for this job',
      );
    }

    // 4. Upload CV to S3
    const cv = await this.s3Service.uploadApplicationCv(file);

    try {
      // 5. Save application details in PostgreSQL
      const application = await this.prisma.application.create({
        data: {
          jobId: job.id,
          jobTitle: job.title,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          coverNote: dto.coverNote ?? '',

          cvKey: cv.cvKey,
          cvFileName: cv.cvFileName,
          cvContentType: cv.cvContentType,
          cvSizeBytes: cv.cvSizeBytes,
        },
        select: {
          id: true,
          jobId: true,
          jobTitle: true,
          name: true,
          email: true,
          phone: true,
          coverNote: true,
          cvFileName: true,
          cvContentType: true,
          cvSizeBytes: true,
          appliedAt: true,
        },
      });

      return {
        message: 'Application submitted successfully',
        application,
      };
    } catch (error) {
      // 6. Database failed after S3 upload.
      // Remove the uploaded CV to avoid orphaned files.
      try {
        await this.s3Service.deleteObject(cv.cvKey);
      } catch (cleanupError) {
        console.error(
          'Failed to cleanup application CV from S3:',
          cv.cvKey,
          cleanupError,
        );
      }

      console.error('Failed to create application:', error);

      throw new InternalServerErrorException('Failed to submit application');
    }
  }

  async getApplicationById(id: string) {
    try {
      const application = await this.prisma.application.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          jobTitle: true,
          name: true,
          email: true,
          phone: true,
          coverNote: true,
          appliedAt: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      return {
        application,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Failed to fetch application:', error);

      throw new InternalServerErrorException('Failed to fetch application');
    }
  }


async getApplicationCvDownloadUrl(id: string) {
    try {
      // 1. Find application and retrieve its CV key
      const application = await this.prisma.application.findUnique({
        where: {
          id,
        },
        select: {
          cvKey: true,
        },
      });
  
      if (!application) {
        throw new NotFoundException('Application not found');
      }
  
      // 2. Generate temporary S3 download URL
      const cvDownloadUrl =
        await this.s3Service.getApplicationCvUrl(application.cvKey);
  
      // 3. Return download URL
      return {
        cvDownloadUrl,
      };
  
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
  
      console.error('Failed to generate application CV URL:', error);
  
      throw new InternalServerErrorException(
        'Failed to generate CV download URL',
      );
    }
  }


async getAllApplications(query: ApplicationQueryDto) {
    try {
      return await this.pagination.paginate({
        order: APPLICATIONS_ORDER,
        limit: query.limit ?? 20,
        cursor: query.cursor,
  
        fetch: (args) =>
          this.prisma.application.findMany({
            ...args,
            select: {
              id: true,
              name: true,
              jobTitle: true,
              phone: true,
              appliedAt: true,
            },
          }),
  
        map: (row) => ({
          id: row.id,
          name: row.name,
          jobTitle: row.jobTitle,
          phone: row.phone,
          appliedAt: row.appliedAt,
        }),
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
  
      console.error('Failed to fetch applications:', error);
  
      throw new InternalServerErrorException(
        'Failed to fetch applications',
      );
    }
  }
  
  
async deleteApplication(id: string) {
    // 1. Find application and retrieve CV key
    const application = await this.prisma.application.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        cvKey: true,
      },
    });
  
    if (!application) {
      throw new NotFoundException('Application not found');
    }
  
    // 2. Delete CV from S3
    await this.s3Service.deleteObject(application.cvKey);
  
    // 3. Delete application record from PostgreSQL
    try {
      await this.prisma.application.delete({
        where: {
          id: application.id,
        },
      });
    } catch (error) {
      console.error(
        'CV deleted from S3, but application database deletion failed:',
        application.id,
        error,
      );
  
      throw new InternalServerErrorException(
        'CV was deleted from storage, but application record could not be deleted',
      );
    }
  
    return {
      message: 'Application deleted successfully',
    };
  }
  
}
