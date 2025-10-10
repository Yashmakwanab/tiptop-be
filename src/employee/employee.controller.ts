import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @Request() req: { user: { email: string } },
  ) {
    createEmployeeDto.created_by = req.user.email;
    createEmployeeDto.updated_by = req.user.email;
    return this.employeeService.create(createEmployeeDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryEmployeeDto) {
    return this.employeeService.findAll(queryDto);
  }

  @Get('statistics')
  getStatistics() {
    return this.employeeService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @Request() req: { user: { email: string } },
  ) {
    updateEmployeeDto.updated_by = req.user.email;
    return this.employeeService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeeService.remove(id);
  }

  @Delete(':id/permanent')
  permanentDelete(@Param('id') id: string) {
    return this.employeeService.permanentDelete(id);
  }

  @Post(':id/resend-credentials')
  resendCredentials(@Param('id') id: string) {
    return this.employeeService.resendCredentials(id);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() body: { password: string },
  ) {
    return this.employeeService.resetPassword(id, body.password);
  }
}
