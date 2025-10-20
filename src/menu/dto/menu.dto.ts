import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  icon: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsBoolean()
  @IsOptional()
  groupTitle?: boolean = false;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number = 0;

  @IsInt()
  @Min(0)
  @IsOptional()
  level?: number;
  key: string;
}

export class UpdateMenuDto {
  @IsString()
  @IsOptional()
  _id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsBoolean()
  @IsOptional()
  groupTitle?: boolean;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  level?: number;
  key: string;
}
