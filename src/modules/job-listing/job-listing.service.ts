import { PaginationService, SortField } from "src/shared/utils/pagination.service";
import { CreateJobListingDto, CreateJobResponseDto, JobListingQueryDto, UpdateJobListingDto } from "./dtos/job-listing.dto";
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";

const JOBS_ORDER: SortField[] = [
    {field:'createdAt', direction:'asc', type:'date'},
    {field:'id', direction:'asc', type:'string'}
]

@Injectable()
export class JobListingService {
    constructor(
        private readonly prisamservice: PrismaService,
        private readonly pagination: PaginationService,
    ){}

    async createJobListing(dto:CreateJobListingDto): Promise<CreateJobResponseDto>{
        try{
     const created = await this.prisamservice.job.create({
        data: {
            title: dto.title,
            location: dto.location,
            employmentType: dto.employmentType,
            experience: dto.experience,
            description: dto.description,
            status: dto.status
        },
        select: {
            id: true,
            title: true,
            location: true,
            employmentType: true,
            experience: true,
            description: true,
            status: true,
            createdAt: true,
          },
     })
     return {
        message:"Job added successfully",
        created
     }
    }
    catch(error){
        console.error('Failed to create job listing:', error);

        throw new InternalServerErrorException(
          'Failed to create job listing',
        );
    }
    }

    async updateJobListing(id:string, dto: UpdateJobListingDto){
        try{
        const job = await this.prisamservice.job.findUnique({
            where: {
                id,
            },
        });

        if(!job){
            throw new NotFoundException("Job not fouud")
        }

        const updatedJob = await this.prisamservice.job.update({
            where:{
                id,
            },
            data: {
                title: dto.title,
                location: dto.location,
                employmentType: dto.employmentType,
                experience: dto.experience,
                description: dto.description,
                status: dto.status
            },
            select: {
                id: true,
                title: true,
                location: true,
                employmentType: true,
                experience: true,
                description: true,
                status: true,
                createdAt: true,
              },
        })

        return {
            message: "Job Listing updated successfully",
            job: updatedJob
        }
    }
    catch (error) {
        if (error instanceof NotFoundException) {
            throw error;
        }

        console.error('Failed to update job listing:', error);

        throw new InternalServerErrorException(
            'Failed to update job listing',
        );
    }
    }

    async getallJob(query: JobListingQueryDto) {
        try {
            return await this.pagination.paginate({
                order: JOBS_ORDER,
                limit: query.limit ?? 20,
                cursor: query.cursor,
    
                fetch: (args) =>
                    this.prisamservice.job.findMany({
                        ...args,
                        select: {
                            id: true,
                            title: true,
                            location: true,
                            employmentType: true,
                            experience: true,
                            description: true,
                            status: true,
                            createdAt: true,
                        },
                    }),
    
                map: (row) => {
                    const { createdAt, ...job } = row;
                    return job;
                },
            });
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
    
            console.error('Failed to fetch job listings:', error);
    
            throw new InternalServerErrorException(
                'Failed to fetch job listings',
            );
        }
    }

    async deleteJobListing(id:string) {
        const job = await this.prisamservice.job.findUnique({
            where: {id}
        })

        if(!job) {
            throw new NotFoundException("Job not found")
        }

        try{
            await this.prisamservice.job.delete({
                where : {
                    id: job.id
                }
            })
            return {
                message: 'Job listing deleted successfully',
            };    
        }
        catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
    
            console.error('Failed to delete job listing:', error);
    
            throw new InternalServerErrorException(
                'Failed to delete job listing',
            );
        }
    }

    async getById(id: string){
        try{
        const job = await this.prisamservice.job.findUnique({
            where: {id}
        })
        if(!job){
            throw new NotFoundException("jbob not found")
        }
        return job
    }
    catch (error) {
        if (error instanceof NotFoundException) {
            throw error;
        }

        console.error('Failed to fetch job listing:', error);

        throw new InternalServerErrorException(
            'Failed to fetch job listing',
        );
    }
    }

}