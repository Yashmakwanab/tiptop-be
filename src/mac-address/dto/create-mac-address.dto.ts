import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMacAddressDto {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  created_by?: string;
}
