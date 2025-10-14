import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateStaffRosterDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsArray()
  @IsNotEmpty()
  roster_dates: string[];

  @IsString()
  @IsNotEmpty()
  slot_id: string;

  @IsString()
  @IsOptional()
  roster_type?: string = 'Roster';

  @IsString()
  @IsOptional()
  created_by?: string;
}
