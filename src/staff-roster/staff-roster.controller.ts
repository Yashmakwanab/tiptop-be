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
import {
  ByTypeCount,
  StaffRosterResponseDto,
  StaffRosterService,
} from './staff-roster.service';
import { CreateStaffRosterDto } from './dto/create-staff-roster.dto';
import { UpdateStaffRosterDto } from './dto/update-staff-roster.dto';
import { QueryStaffRosterDto } from './dto/query-staff-roster.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('staff-roster')
@UseGuards(JwtAuthGuard)
export class StaffRosterController {
  constructor(private readonly staffRosterService: StaffRosterService) {}

  @Post()
  create(
    @Body() createDto: CreateStaffRosterDto,
    @Request() req: { user: { email: string } },
  ) {
    createDto.created_by = req.user.email;
    return this.staffRosterService.create(createDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryStaffRosterDto) {
    return this.staffRosterService.findAll(queryDto);
  }

  @Get('statistics')
  getStatistics(): Promise<{ total: number; byType: ByTypeCount }> {
    return this.staffRosterService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffRosterService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateStaffRosterDto,
    @Request() req: { user: { email: string } },
  ): Promise<StaffRosterResponseDto> {
    updateDto.updated_by = req.user.email;
    return this.staffRosterService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffRosterService.remove(id);
  }

  @Post('delete-many')
  removeMany(@Body() body: { ids: string[] }) {
    return this.staffRosterService.removeMany(body.ids);
  }
}
