import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RolePermissionService } from './role-permission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssignRolePermissionsDto } from './dto/role-permission.dto';

@Controller('role-permission')
@UseGuards(JwtAuthGuard)
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post('assign')
  assignPermissions(
    @Body() dto: AssignRolePermissionsDto,
    @Request() req: { user: { email: string } },
  ) {
    dto.created_by = req.user.email;
    return this.rolePermissionService.assignPermissions(dto);
  }

  @Get('role/:roleId')
  getRolePermissions(@Param('roleId') roleId: string) {
    return this.rolePermissionService.getRolePermissions(roleId);
  }

  @Get('role-menus/:roleId')
  getUserMenusByRole(@Param('roleId') roleId: string) {
    return this.rolePermissionService.getUserMenusByRole(roleId);
  }
}
