import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserLogsService } from './user-logs.service';
import { QueryStaffRosterDto } from 'src/staff-roster/dto/query-staff-roster.dto';

@Controller('user-logs')
export class UserLogsController {
  constructor(private readonly userLogsService: UserLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: any) {
    return this.userLogsService.createLog(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query() queryDto: QueryStaffRosterDto) {
    return this.userLogsService.findAll(queryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async findByUser(@Param('userId') userId: string) {
    return this.userLogsService.findByUser(userId);
  }
}
