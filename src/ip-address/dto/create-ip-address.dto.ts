import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateIpAddressDto {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  created_by?: string;
}
