import { PartialType } from '@nestjs/mapped-types';
import { CreateIpAddressDto } from './create-ip-address.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateIpAddressDto extends PartialType(CreateIpAddressDto) {
  @IsString()
  @IsOptional()
  updated_by?: string;
}
