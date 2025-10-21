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
import { IpAddressService } from './ip-address.service';
import { CreateIpAddressDto } from './dto/create-ip-address.dto';
import { UpdateIpAddressDto } from './dto/update-ip-addressdto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryIpAddressDto } from './dto/query-ip-address.dto';

@Controller('ip-address')
@UseGuards(JwtAuthGuard)
export class IpAddressController {
  constructor(private readonly ipAddressService: IpAddressService) {}

  @Post()
  create(
    @Body() createIpAddressDto: CreateIpAddressDto,
    @Request() req: { user: { email: string } },
  ) {
    createIpAddressDto.created_by = req.user.email;
    return this.ipAddressService.create(createIpAddressDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryIpAddressDto) {
    return this.ipAddressService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ipAddressService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIpAddressDto: UpdateIpAddressDto,
    @Request() req: { user: { email: string } },
  ) {
    updateIpAddressDto.updated_by = req.user.email;
    return this.ipAddressService.update(id, updateIpAddressDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ipAddressService.remove(id);
  }

  @Post('delete-many')
  removeMany(@Body() body: { ids: string[] }) {
    return this.ipAddressService.removeMany(body.ids);
  }
}
