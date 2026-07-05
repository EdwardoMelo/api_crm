import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_CAMPAIGN_ATTACHMENT_SIZE_BYTES } from '../constants/email-campaign.constants';
import { CreateEmailCampaignDTORequest } from '../dto/request/CreateEmailCampaignDTORequest';
import {
  CreateEmailCampaignResultDTOResponse,
  EmailCampaignDetailDTOResponse,
  EmailCampaignDTOResponse,
} from '../dto/response/EmailCampaignDTOResponse';
import { EmailCampaignService } from '../service/EmailCampaignService';

@Controller('email-campaigns')
export class EmailCampaignController {
  constructor(private readonly campaignService: EmailCampaignService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CAMPAIGN_ATTACHMENT_SIZE_BYTES },
    }),
  )
  create(
    @Body() dto: CreateEmailCampaignDTORequest,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateEmailCampaignResultDTOResponse> {
    return this.campaignService.create(dto, file);
  }

  @Get()
  findAll(): Promise<EmailCampaignDTOResponse[]> {
    return this.campaignService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<EmailCampaignDetailDTOResponse> {
    return this.campaignService.findById(id);
  }
}
