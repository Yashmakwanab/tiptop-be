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
import { MacAddressService } from './mac-address.service';
import { CreateMacAddressDto } from './dto/create-mac-address.dto';
import { UpdateMacAddressDto } from './dto/update-mac-addressdto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryMacAddressDto } from './dto/query-mac-address.dto';

@Controller('mac-address')
@UseGuards(JwtAuthGuard)
export class MacAddressController {
  constructor(private readonly macAddressService: MacAddressService) {}

  @Post()
  create(
    @Body() createMacAddressDto: CreateMacAddressDto,
    @Request() req: { user: { email: string } },
  ) {
    createMacAddressDto.created_by = req.user.email;
    return this.macAddressService.create(createMacAddressDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryMacAddressDto) {
    return this.macAddressService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.macAddressService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMacAddressDto: UpdateMacAddressDto,
    @Request() req: { user: { email: string } },
  ) {
    updateMacAddressDto.updated_by = req.user.email;
    return this.macAddressService.update(id, updateMacAddressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.macAddressService.remove(id);
  }

  @Post('delete-many')
  removeMany(@Body() body: { ids: string[] }) {
    return this.macAddressService.removeMany(body.ids);
  }
}
