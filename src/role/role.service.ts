import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto, QueryRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RolePermissionDocument } from 'src/role-permission/schemas/role-permission.schema';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    @InjectModel('RolePermission')
    private rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const existingRole = await this.roleModel
      .findOne({
        name: createRoleDto.name,
        is_deleted: false,
        isActive: createRoleDto.isActive,
      })
      .exec();

    if (existingRole) {
      throw new ConflictException(
        `Role with name ${createRoleDto.name} already exists`,
      );
    }

    const role = new this.roleModel(createRoleDto);
    return role.save();
  }

  async findAll(queryDto: QueryRoleDto) {
    const {
      page = 1,
      limit = 10,
      search,
      created_by,
      sortBy = 'date_entered',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { is_deleted: false };

    if (search) {
      filter.$or = [{ name: { $regex: queryDto.search, $options: 'i' } }];
    }

    if (created_by) {
      filter.created_by = created_by;
    }

    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.roleModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.roleModel.countDocuments(filter).exec(),
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

  async findOne(id: string): Promise<any> {
    // Fetch role
    const role = await this.roleModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Fetch permissions for this role
    const permissions = await this.rolePermissionModel
      .find({ roleId: id, is_deleted: false })
      .select('menuId menuKey menuName')
      .exec();

    return {
      ...role.toObject(),
      permissions,
    };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleModel
      .findOneAndUpdate({ _id: id, is_deleted: false }, updateRoleDto, {
        new: true,
      })
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async remove(id: string): Promise<{ message: string }> {
    const role = await this.roleModel
      .findOneAndUpdate({ _id: id }, { is_deleted: true }, { new: true })
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return { message: 'Role deleted successfully' };
  }

  async removeMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.roleModel
      .updateMany(
        { _id: { $in: ids }, is_deleted: false },
        { is_deleted: true },
      )
      .exec();

    return { deletedCount: result.modifiedCount };
  }
}
