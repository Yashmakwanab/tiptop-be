import { PartialType } from '@nestjs/mapped-types';
import { CreateMacAddressDto } from './create-mac-address.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateMacAddressDto extends PartialType(CreateMacAddressDto) {
  @IsString()
  @IsOptional()
  updated_by?: string;
}
