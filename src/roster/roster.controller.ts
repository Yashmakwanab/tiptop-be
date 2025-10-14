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
import { RosterService } from './roster.service';
import { CreateRosterDto } from './dto/create-roster.dto';
import { UpdateRosterDto } from './dto/update-roster.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryRosterDto } from './dto/query-roster.dto';

@Controller('roster')
@UseGuards(JwtAuthGuard)
export class RosterController {
  constructor(private readonly rosterService: RosterService) {}

  @Post()
  create(
    @Body() createRosterDto: CreateRosterDto,
    @Request() req: { user: { email: string } },
  ) {
    createRosterDto.created_by = req.user.email;
    return this.rosterService.create(createRosterDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryRosterDto) {
    return this.rosterService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rosterService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRosterDto: UpdateRosterDto,
    @Request() req: { user: { email: string } },
  ) {
    updateRosterDto.updated_by = req.user.email;
    return this.rosterService.update(id, updateRosterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rosterService.remove(id);
  }

  @Delete(':id/permanent')
  permanentDelete(@Param('id') id: string) {
    return this.rosterService.permanentDelete(id);
  }

  @Post('delete-many')
  removeMany(@Body() body: { ids: string[] }) {
    return this.rosterService.removeMany(body.ids);
  }
}
