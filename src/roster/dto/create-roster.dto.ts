import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRosterDto {
  @IsString()
  @IsNotEmpty()
  start_time: string;

  @IsString()
  @IsNotEmpty()
  end_time: string;

  @IsString()
  @IsNotEmpty()
  total_hrs: string;

  @IsString()
  @IsOptional()
  created_by?: string;
}
