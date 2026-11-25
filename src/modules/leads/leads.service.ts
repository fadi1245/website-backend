import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";
import { PaginationService, SortField } from "src/shared/utils/pagination.service";
import { CreateLeadsDto, CreateLeadsResponseDataDto, CreateLeadsResponseDto, LeadsQueryDto, UpdateLeadsDto } from "./dtos/leads.dto";

const LEADS_ORDER: SortField[] = [
    {field:'receivedAt', direction:'desc', type:'date'},
    {field:'id', direction:'desc', type:'string'}
]

@Injectable()
export class LeadsService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly pagination: PaginationService,
    ) {}

    async createLeads(dto:CreateLeadsDto):Promise<CreateLeadsResponseDto>{
        try{
            const created = await this.prismaService.lead.create({
                data:{
                    name: dto.name.trim(),
                    email: dto.email?.trim() || null,
                    phone: dto.phone?.trim() || null,
                    company:dto.company || null,
                    service: dto.service,
                    phoneConsent:dto.phoneConsent??false,
                    phoneConsentAt: dto.phoneConsent ? new Date() : null,
                    message:dto.message || null
                },
                select:{
                    id:true,
                    name:true,
                    email:true,
                    phone:true,
                    company:true,
                    service:true,
                    phoneConsent:true,
                    phoneConsentAt:true,
                    message:true,
                    status:true,
                    receivedAt:true
                }
            })
            return{
                message:"Lead added successfully",
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

    async updateLeads(id: string, dto: UpdateLeadsDto){
        try{
            const lead = await this.prismaService.lead.findUnique({
                where:{
                    id,
                },
            });

            if(!lead){
                throw new NotFoundException("Lead not found")
            }

            const updatedLead = await this.prismaService.lead.update({
                where: {
                    id,
                },
                data: {
                    status: dto.status
                },
                select: {
                    id:true,
                    name:true,
                    email:true,
                    phone:true,
                    company:true,
                    service:true,
                    phoneConsent:true,
                    phoneConsentAt:true,
                    message:true,
                    status:true,
                    receivedAt:true
                }
            })
            return {
                message: "Lead updated successfully",
                lead: updatedLead
            }
        }
        catch(error){
            if (error instanceof NotFoundException) {
                throw error;
            }
    
            console.error('Failed to update Lead:', error);
    
            throw new InternalServerErrorException(
                'Failed to update Lead',
            );
        }
    }

    async getAllLeads(query: LeadsQueryDto) {
        try {
          return await this.pagination.paginate({
            order: LEADS_ORDER,
            limit: query.limit ?? 20,
            cursor: query.cursor,
      
            fetch: (args) =>
              this.prismaService.lead.findMany({
                ...args,
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  company: true,
                  service: true,
                  phoneConsent: true,
                  status: true,
                  receivedAt: true,
                },
              }),
      
            map: (row) => row,
          });
        } catch (error) {
          if (error instanceof BadRequestException) {
            throw error;
          }
      
          console.error('Failed to fetch leads:', error);
      
          throw new InternalServerErrorException(
            'Failed to fetch leads',
          );
        }
      }

      async getLeadById(id: string) {
        try {
          const lead = await this.prismaService.lead.findUnique({
            where: {
              id,
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              company: true,
              service: true,
              phoneConsent: true,
              phoneConsentAt: true,
              message: true,
              status: true,
              receivedAt: true,
              updatedAt: true,
            },
          });
      
          if (!lead) {
            throw new NotFoundException('Lead not found');
          }
      
          return lead;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
      
          console.error('Failed to fetch lead:', error);
      
          throw new InternalServerErrorException(
            'Failed to fetch lead',
          );
        }
      }

      async deleteLead(id: string) {
        try {
          const lead = await this.prismaService.lead.findUnique({
            where: {
              id,
            },
          });
      
          if (!lead) {
            throw new NotFoundException('Lead not found');
          }
      
          await this.prismaService.lead.delete({
            where: {
              id,
            },
          });
      
          return {
            message: 'Lead deleted successfully',
          };
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }
      
          console.error('Failed to delete lead:', error);
      
          throw new InternalServerErrorException(
            'Failed to delete lead',
          );
        }
      }
}