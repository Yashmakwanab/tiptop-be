import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Employee, EmployeeDocument } from './schemas/employee.schema';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Check if email already exists
    const existingEmail = await this.employeeModel.findOne({
      emailAddress: createEmployeeDto.emailAddress,
      is_deleted: false,
    });
    if (existingEmail) {
      throw new ConflictException('Email address already exists');
    }

    // Check if username already exists
    const existingUsername = await this.employeeModel.findOne({
      user_name: createEmployeeDto.user_name,
      is_deleted: false,
    });
    if (existingUsername) {
      throw new ConflictException('Username already exists');
    }

    const employee = new this.employeeModel(createEmployeeDto);
    return employee.save();
  }

  async findAll(queryDto: QueryEmployeeDto) {
    const { page = 1, limit = 10, search, work_status, category } = queryDto;
    const skip = (page - 1) * limit;

    // Build query
    const query: Record<string, any> = { is_deleted: false };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { emailAddress: { $regex: search, $options: 'i' } },
        { user_name: { $regex: search, $options: 'i' } },
        { user_phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (work_status) {
      query.work_status = work_status;
    }

    if (category) {
      query.category = category;
    }

    const [employees, total] = await Promise.all([
      this.employeeModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.employeeModel.countDocuments(query),
    ]);

    return {
      data: employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.employeeModel.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (
      updateEmployeeDto.emailAddress &&
      updateEmployeeDto.emailAddress !== employee.emailAddress
    ) {
      const existingEmail = await this.employeeModel.findOne({
        emailAddress: updateEmployeeDto.emailAddress,
        _id: { $ne: id },
        is_deleted: false,
      });
      if (existingEmail) {
        throw new ConflictException('Email address already exists');
      }
    }

    // Check if username is being changed and if it already exists
    if (
      updateEmployeeDto.user_name &&
      updateEmployeeDto.user_name !== employee.user_name
    ) {
      const existingUsername = await this.employeeModel.findOne({
        user_name: updateEmployeeDto.user_name,
        _id: { $ne: id },
        is_deleted: false,
      });
      if (existingUsername) {
        throw new ConflictException('Username already exists');
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return employee.save();
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    employee.is_deleted = true;
    await employee.save();
    return { message: 'Employee deleted successfully' };
  }

  async permanentDelete(id: string) {
    const result = await this.employeeModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Employee not found');
    }
    return { message: 'Employee permanently deleted' };
  }

  async getStatistics() {
    const [total, working, resigned] = await Promise.all([
      this.employeeModel.countDocuments({ is_deleted: false }),
      this.employeeModel.countDocuments({
        is_deleted: false,
        work_status: 'Working',
      }),
      this.employeeModel.countDocuments({
        is_deleted: false,
        work_status: { $ne: 'Working' },
      }),
    ]);

    return {
      total,
      working,
      resigned,
    };
  }
}
