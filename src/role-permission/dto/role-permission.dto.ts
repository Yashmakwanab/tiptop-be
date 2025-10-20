import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class PermissionItem {
  @IsString()
  @IsNotEmpty()
  menuId: string; // menu _id from frontend
}

export class AssignRolePermissionsDto {
  @IsString()
  @IsNotEmpty()
  roleId: string;

  @IsArray()
  @IsMongoId({ each: true })
  permissions: string[];

  @IsOptional()
  @IsString()
  created_by?: string;
}
