import { PartialType } from '@nestjs/mapped-types';
import { CreateRosterDto } from './create-roster.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateRosterDto extends PartialType(CreateRosterDto) {
  @IsString()
  @IsOptional()
  updated_by?: string;
}
