import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Trim } from '../../../../common/decorators';
import {
  CampaignRecipientType,
  MAX_CAMPAIGN_RECIPIENTS,
} from '../../constants/email-campaign.constants';

function parseIntArray(value: unknown): number[] {
  const raw =
    typeof value === 'string' && value.trim().startsWith('[')
      ? (JSON.parse(value) as unknown[])
      : Array.isArray(value)
        ? value
        : value === undefined || value === ''
          ? []
          : [value];
  return raw
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

export class CreateEmailCampaignDTORequest {
  @IsIn([CampaignRecipientType.CLIENT, CampaignRecipientType.LEAD])
  recipientType: CampaignRecipientType;

  @Transform(({ value }) => parseIntArray(value))
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_CAMPAIGN_RECIPIENTS)
  @IsInt({ each: true })
  recipientIds: number[];

  @Trim()
  @IsString()
  @IsNotEmpty()
  assunto: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  corpo: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === undefined ? undefined : Number(value)))
  @IsInt()
  templateId?: number;
}
