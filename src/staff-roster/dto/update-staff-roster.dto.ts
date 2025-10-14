import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateStaffRosterDto {
  @IsString()
  @IsOptional()
  user_id?: string;

  @IsDateString()
  @IsOptional()
  roster_date?: string;

  @IsString()
  @IsOptional()
  slot_id?: string;

  @IsString()
  @IsOptional()
  roster_type?: string;

  @IsString()
  @IsOptional()
  updated_by?: string;
}
