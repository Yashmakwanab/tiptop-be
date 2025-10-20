import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryMenuDto } from './schemas/menu.schema';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  createMenu(
    @Body() dto: { parent: CreateMenuDto; submenus?: CreateMenuDto[] },
  ) {
    return this.menuService.create(dto);
  }

  @Get()
  findAll(@Query() queryDto: QueryMenuDto) {
    return this.menuService.findAll(queryDto);
  }

  @Get('hierarchy')
  findHierarchyWithSubmenus(@Query() queryDto: QueryMenuDto) {
    return this.menuService.findHierarchyWithSubmenus(queryDto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateMenuDto: { parent: UpdateMenuDto; submenus?: UpdateMenuDto[] },
  ) {
    return this.menuService.update(id, updateMenuDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }

  @Post('delete-many')
  removeMany(@Body() body: { ids: string[] }) {
    return this.menuService.removeMany(body.ids);
  }
}
