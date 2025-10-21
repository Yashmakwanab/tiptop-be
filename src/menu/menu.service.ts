import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu, MenuDocument, QueryMenuDto } from './schemas/menu.schema';
import { CreateMenuDto, UpdateMenuDto } from './dto/menu.dto';

interface MenuData {
  _id: Types.ObjectId;
  name: string;
  icon?: string;
  path?: string;
  level?: number;
  order?: number;
  groupTitle?: boolean;
  parentId?: Types.ObjectId | null;
}

export interface MenuHierarchy {
  _id: Types.ObjectId;
  name: string;
  icon?: string;
  path?: string;
  level?: number;
  order?: number;
  groupTitle?: boolean;
  parentId?: string;
  subItems: MenuHierarchy[];
  pro: boolean;
}

@Injectable()
export class MenuService {
  constructor(@InjectModel(Menu.name) private menuModel: Model<MenuDocument>) {}

  async create(dto: {
    parent: CreateMenuDto;
    submenus?: CreateMenuDto[];
  }): Promise<any> {
    const { parent, submenus = [] } = dto;

    // Calculate level based on parentId
    let level = 0;
    if (parent.parentId) {
      const parentMenu = await this.menuModel.findById(parent.parentId).exec();
      if (!parentMenu) {
        throw new NotFoundException('Parent menu not found');
      }
      level = (parentMenu.level || 0) + 1;
    }

    // Prepare parent data with all required fields
    const parentData = {
      name: parent.name,
      icon: parent.icon || '',
      path: parent.path || '',
      order: parent.order !== undefined ? parent.order : 0,
      groupTitle: parent.groupTitle !== undefined ? parent.groupTitle : false,
      level: level,
      key: `${parent.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      is_deleted: false,
      ...(parent.parentId && { parentId: parent.parentId }),
    };

    // Create parent menu
    const createdParent: MenuDocument = await this.menuModel.create(parentData);

    // Create submenus if provided
    if (submenus.length > 0) {
      const formattedSubs = submenus.map((submenu, i) => ({
        ...submenu,
        parentId: createdParent._id,
        level: (createdParent.level ?? 0) + 1,
        key: `${submenu.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${i}`,
        order: submenu.order !== undefined ? submenu.order : i,
        groupTitle:
          submenu.groupTitle !== undefined ? submenu.groupTitle : false,
        is_deleted: false,
      }));

      await this.menuModel.insertMany(formattedSubs);
    }

    // Return the created menu hierarchy
    const hierarchy = await this.findHierarchyWithSubmenus({});

    return {
      message: 'Menu created successfully',
      data: hierarchy,
    };
  }

  async findAll(queryDto: QueryMenuDto) {
    const { page = 1, limit = 10, search, created_by } = queryDto;

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { is_deleted: false };

    if (search) {
      filter.$or = [{ name: { $regex: queryDto.search, $options: 'i' } }];
    }

    if (created_by) {
      filter.created_by = created_by;
    }

    const [data, total] = await Promise.all([
      this.menuModel
        .find(filter)
        .sort({ order: 1 })
        .populate('parentId', 'name')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.menuModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findHierarchyWithSubmenus(queryDto: QueryMenuDto): Promise<{
    data: MenuHierarchy[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10, search } = queryDto;
    const skip = (page - 1) * limit;

    // Build filter for parent menus only (no parentId = root level)
    const parentFilter: Record<string, any> = {
      is_deleted: false,
      $or: [
        { parentId: { $exists: false } }, // field does not exist
        { parentId: null }, // field is null
        { parentId: '' }, // field is empty string
      ],
    };

    if (search) {
      parentFilter.name = { $regex: search, $options: 'i' };
    }

    // Fetch paginated parent menus and total count
    const [parentMenus, total] = await Promise.all([
      this.menuModel
        .find(parentFilter)
        .sort({ order: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.menuModel.countDocuments(parentFilter).exec(),
    ]);

    // Get IDs of paginated parents
    const parentIds = parentMenus.map((m) => m._id);

    // Fetch all children of these parents
    const children = await this.menuModel
      .find({
        parentId: { $in: parentIds },
        is_deleted: false,
      })
      .sort({ order: 1 })
      .lean()
      .exec();

    // Combine parents and children to build hierarchy
    const allMenus = [...parentMenus, ...children];
    const hierarchy = this.buildHierarchy(allMenus as any[]);

    return {
      data: hierarchy,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildHierarchy(menus: MenuData[]): MenuHierarchy[] {
    const menuMap = new Map<string, MenuHierarchy>();
    const rootMenus: MenuHierarchy[] = [];

    // First pass: create all menu objects
    menus.forEach((menu) => {
      menuMap.set(menu._id.toString(), {
        _id: menu._id,
        name: menu.name,
        icon: menu.icon || '',
        path: menu.path || '',
        level: menu.level,
        order: menu.order,
        groupTitle: menu.groupTitle,
        parentId: menu.parentId?.toString(),
        subItems: [],
        pro: false,
      });
    });

    // Second pass: build hierarchy
    menus.forEach((menu) => {
      const menuObj = menuMap.get(menu._id.toString());
      if (!menuObj) return;

      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId.toString());
        if (parent) {
          parent.subItems.push(menuObj);
        }
      } else {
        rootMenus.push(menuObj);
      }
    });

    // Sort root menus and their subItems by order
    rootMenus.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    rootMenus.forEach((menu) => {
      if (menu.subItems?.length) {
        menu.subItems.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    });

    return rootMenus;
  }

  async update(
    id: string,
    dto: { parent: UpdateMenuDto; submenus?: UpdateMenuDto[] },
  ): Promise<any> {
    const { parent, submenus = [] } = dto;

    // 1. Validate parent menu exists
    const existingMenu = await this.menuModel.findById(id);
    if (!existingMenu || existingMenu.is_deleted) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    // 2. Calculate and set level for parent
    if (parent.parentId) {
      const parentMenu = await this.menuModel.findById(parent.parentId).exec();
      if (!parentMenu) {
        throw new NotFoundException('Parent menu not found');
      }
      parent.level = (parentMenu.level || 0) + 1;
    } else {
      parent.level = 0;
    }

    // 3. Update parent menu (exclude _id from update data)
    const { _id: excludeId, ...parentUpdateData } = parent as any;

    // Explicitly include order in the update
    const updateData = {
      ...parentUpdateData,
      ...(parent.order !== undefined && { order: parent.order }),
    };

    const updatedParent = await this.menuModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedParent) {
      throw new NotFoundException('Failed to update parent menu');
    }

    // 4. Fetch all existing submenus for this parent
    const existingSubmenus = await this.menuModel
      .find({ parentId: id, is_deleted: false })
      .lean()
      .exec();

    // Get IDs from payload that have _id (existing submenus to keep)
    const incomingIds = submenus
      .filter((sm) => sm._id)
      .map((sm) => sm._id!.toString());

    // 5. Find duplicate names in existing submenus
    const nameCountMap = new Map<string, any[]>();
    existingSubmenus.forEach((submenu) => {
      const name = submenu.name;
      if (!nameCountMap.has(name)) {
        nameCountMap.set(name, []);
      }
      nameCountMap.get(name)!.push(submenu);
    });

    // Find submenus to delete
    const idsToDelete: any[] = [];

    for (const existing of existingSubmenus) {
      const existingIdStr = existing._id.toString();
      const isInPayload = incomingIds.includes(existingIdStr);

      // Check if this submenu has duplicate names
      const duplicates = nameCountMap.get(existing.name) || [];
      const hasDuplicates = duplicates.length > 1;

      if (hasDuplicates) {
        // If there are duplicates, delete the ones NOT in payload
        // Or if both have same name, delete the older one (first created)
        const sortedDuplicates = [...duplicates].sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return aTime - bTime;
        });

        // If current is the first (oldest) duplicate and there are multiple
        if (
          sortedDuplicates[0]._id.toString() === existingIdStr &&
          duplicates.length > 1
        ) {
          idsToDelete.push(existing._id);
          continue;
        }
      }

      // Regular deletion logic - not in payload
      if (!isInPayload) {
        idsToDelete.push(existing._id);
      }
    }

    // Permanently delete submenus not in the payload
    if (idsToDelete.length > 0) {
      await this.menuModel
        .deleteMany({
          _id: { $in: idsToDelete },
        })
        .exec();
    }

    // 6. Process each submenu in the payload
    for (const submenu of submenus) {
      const submenuLevel = (updatedParent.level || 0) + 1;

      if (submenu._id) {
        // Update existing submenu - exclude _id from update
        const { _id: subId, ...submenuUpdateData } = submenu as any;

        await this.menuModel.findOneAndUpdate(
          { _id: submenu._id, is_deleted: false },
          {
            ...submenuUpdateData,
            parentId: updatedParent._id,
            level: submenuLevel,
            // Explicitly set order if provided
            ...(submenu.order !== undefined && { order: submenu.order }),
          },
          { new: true },
        );
      } else {
        // Create new submenu (no checking for duplicates)
        const key = `${submenu.name?.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

        const newSubmenu = {
          ...submenu,
          parentId: updatedParent._id,
          level: submenuLevel,
          key,
          is_deleted: false,
          // Explicitly set order if provided, otherwise default
          order: submenu.order !== undefined ? submenu.order : 0,
        };

        await this.menuModel.create(newSubmenu);
      }
    }

    // 7. Return updated hierarchy (fetch fresh data)
    const hierarchy = await this.findHierarchyWithSubmenus({});

    return {
      message: 'Menu updated successfully',
      data: hierarchy,
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    // Check if menu exists and is not already deleted
    const menu = await this.menuModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!menu) {
      throw new NotFoundException(`Menu with ID ${id} not found`);
    }

    // Find all children (submenus) of this menu
    const children = await this.menuModel
      .find({ parentId: id, is_deleted: false })
      .exec();

    const childrenIds = children.map((child) => child._id);

    // Permanently delete the parent and all its children
    await this.menuModel.deleteMany({
      _id: { $in: [id, ...childrenIds] },
    });

    return {
      message: `Menu and ${children.length} submenu(s) deleted successfully`,
    };
  }

  async removeMany(ids: string[]): Promise<{ deletedCount: number }> {
    if (!ids || ids.length === 0) {
      return { deletedCount: 0 };
    }

    // Find all menus to be deleted
    const menusToDelete = await this.menuModel
      .find({ _id: { $in: ids }, is_deleted: false })
      .lean()
      .exec();

    if (menusToDelete.length === 0) {
      return { deletedCount: 0 };
    }

    // Collect all IDs to delete (parents + their children)
    const allIdsToDelete: string[] = [];

    for (const menu of menusToDelete) {
      // Add the parent menu ID
      allIdsToDelete.push(menu._id.toString());

      // Find all children of this menu
      const children = await this.menuModel
        .find({ parentId: menu._id, is_deleted: false })
        .lean()
        .exec();

      // Add all children IDs
      for (const child of children) {
        allIdsToDelete.push(child._id.toString());
      }
    }

    // Permanently delete all menus (parents + children)
    const result = await this.menuModel.deleteMany({
      _id: { $in: allIdsToDelete },
    });

    return { deletedCount: result.deletedCount || 0 };
  }
}
