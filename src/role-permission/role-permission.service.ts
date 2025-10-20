import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Document } from 'mongoose';
import { AssignRolePermissionsDto } from './dto/role-permission.dto';
import {
  RolePermission,
  RolePermissionDocument,
} from './schemas/role-permission.schema';

export interface Menu {
  _id: Types.ObjectId;
  name: string;
  key: string;
  icon?: string;
  path?: string;
  parentId?: Types.ObjectId | null;
  level?: number;
  groupTitle?: boolean;
  is_deleted?: boolean;
  isActive?: boolean;
  order?: number;
}

export interface MenuHierarchy {
  _id: Types.ObjectId;
  name: string;
  icon?: string;
  path?: string;
  key: string;
  level?: number;
  groupTitle?: boolean;
  subItems: MenuHierarchy[];
  pro: boolean;
}

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectModel(RolePermission.name)
    private readonly rolePermissionModel: Model<RolePermissionDocument>,
    @InjectModel('Menu')
    private readonly menuModel: Model<Menu & Document>,
  ) {}

  async assignPermissions(
    dto: AssignRolePermissionsDto,
  ): Promise<RolePermissionDocument[]> {
    const { roleId, permissions, created_by } = dto;
    const createdBy = created_by ?? 'system';

    const roleObjectId = new Types.ObjectId(roleId);

    // Remove existing role permissions
    await this.rolePermissionModel.deleteMany({ roleId: roleObjectId });

    // Convert string IDs to ObjectId
    const menuIds = permissions.map((id) => new Types.ObjectId(id));

    // Fetch menus from DB
    const menus = await this.menuModel
      .find({ _id: { $in: menuIds }, is_deleted: false })
      .exec();

    if (!menus.length) {
      return []; // no valid menus found
    }

    // Map to RolePermission documents, skip nulls
    const permissionDocs = menus
      .filter((menu) => menu._id) // skip null menu._id
      .map((menu) => ({
        roleId: roleObjectId,
        menuId: menu._id,
        menuKey: menu._id,
        menuName: menu.name,
        created_by: createdBy,
        is_deleted: false,
      }));

    if (!permissionDocs.length) return [];

    return this.rolePermissionModel.insertMany(
      permissionDocs,
    ) as unknown as RolePermissionDocument[];
  }

  async getRolePermissions(roleId: string): Promise<RolePermissionDocument[]> {
    return this.rolePermissionModel
      .find({ roleId: new Types.ObjectId(roleId), is_deleted: false })
      .exec();
  }

  async getUserMenusByRole(roleId: string): Promise<Menu[]> {
    const permissions = await this.rolePermissionModel
      .find({ roleId: new Types.ObjectId(roleId), is_deleted: false })
      .exec();

    const allowedMenuIds = permissions.map((p) => p.menuId.toString());

    const allMenus = await this.menuModel
      .find({ is_deleted: false, isActive: true })
      .sort({ order: 1 })
      .exec();

    const filteredMenus = allMenus.filter((menu) =>
      allowedMenuIds.includes(menu._id.toString()),
    );
    return this.buildMenuHierarchy(filteredMenus);
  }

  private filterMenusWithAccess(
    allMenus: Menu[],
    allowedKeys: string[],
  ): Menu[] {
    const hasAccessRecursive = (menu: Menu): boolean => {
      if (allowedKeys.includes(menu.key)) return true;
      if (menu.groupTitle) return true;

      const children = allMenus.filter(
        (m) => m.parentId?.toString() === menu._id.toString(),
      );
      return children.some((child) => hasAccessRecursive(child));
    };

    return allMenus.filter((menu) => hasAccessRecursive(menu));
  }

  private buildMenuHierarchy(menus: Menu[]): MenuHierarchy[] {
    const menuMap = new Map<string, MenuHierarchy>();
    const rootMenus: MenuHierarchy[] = [];

    menus.forEach((menu) => {
      menuMap.set(menu._id.toString(), {
        _id: menu._id,
        name: menu.name,
        icon: menu.icon,
        path: menu.path,
        key: menu.key,
        level: menu.level,
        groupTitle: menu.groupTitle,
        subItems: [],
        pro: false,
      });
    });

    menus.forEach((menu) => {
      const menuObj = menuMap.get(menu._id.toString());
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId.toString());
        if (parent) parent.subItems.push(menuObj!);
      } else {
        rootMenus.push(menuObj!);
      }
    });

    return rootMenus;
  }
}
