import { Body, Controller, Get, Post } from '@nestjs/common';
import { SendBudgetEmailDTORequest } from '../dto/request/SendBudgetEmailDTORequest';
import { SendChargeEmailDTORequest } from '../dto/request/SendChargeEmailDTORequest';
import { EmailLogDTOResponse } from '../dto/response/EmailLogDTOResponse';
import { EmailService } from '../service/EmailService';

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('budget')
  sendBudget(@Body() dto: SendBudgetEmailDTORequest): Promise<EmailLogDTOResponse> {
    return this.emailService.sendBudgetEmail(dto);
  }

  @Post('charge')
  sendCharge(@Body() dto: SendChargeEmailDTORequest): Promise<EmailLogDTOResponse> {
    return this.emailService.sendChargeEmail(dto);
  }

  @Get('logs')
  findLogs(): Promise<EmailLogDTOResponse[]> {
    return this.emailService.findAllLogs();
  }
}
