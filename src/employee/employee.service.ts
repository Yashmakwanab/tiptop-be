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
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectModel(Employee.name)
    private employeeModel: Model<EmployeeDocument>,
    private mailService: MailService,
  ) {}

  private generateRandomPassword(): string {
    const length = 12;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

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

    // Use provided password or generate random one
    const tempPassword =
      createEmployeeDto.password || this.generateRandomPassword();

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create employee record
    const employee = new this.employeeModel({
      ...createEmployeeDto,
      password: hashedPassword,
      isActive: true,
    });
    await employee.save();

    // Send credentials email
    try {
      await this.mailService.sendEmployeeCredentials(
        createEmployeeDto.emailAddress,
        createEmployeeDto.full_name,
        createEmployeeDto.user_name,
        tempPassword,
        createEmployeeDto.isSuperAdmin || false,
      );
    } catch (error) {
      console.error('Failed to send email:', error);
    }

    return {
      employee: {
        ...employee.toObject(),
        password: undefined, // Don't return password in response
      },
      message:
        'Employee created successfully. Login credentials have been sent to their email.',
    };
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
        .select('-password -otp')
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
    const employee = await this.employeeModel.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

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

    if (updateEmployeeDto.password) {
      const currentHashedPassword = employee.password;

      // Check if the incoming password matches existing one (means it's already hashed)
      const isAlreadyHashed = await bcrypt.compare(
        updateEmployeeDto.password,
        currentHashedPassword,
      );

      if (!isAlreadyHashed) {
        // If not hashed yet, hash it now
        updateEmployeeDto.password = await bcrypt.hash(
          updateEmployeeDto.password,
          10,
        );
      } else {
        // If it's already hashed, keep existing hash
        updateEmployeeDto.password = currentHashedPassword;
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return employee.save();
  }

  async remove(id: string) {
    const employee = await this.employeeModel.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    employee.is_deleted = true;
    employee.isActive = false;
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

  async resendCredentials(id: string) {
    const employee = await this.employeeModel.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Generate new password
    const tempPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update password
    employee.password = hashedPassword;
    await employee.save();

    // Send credentials email
    await this.mailService.sendEmployeeCredentials(
      employee.emailAddress,
      employee.full_name,
      employee.user_name,
      tempPassword,
      employee.isSuperAdmin,
    );

    return { message: 'Credentials sent successfully to employee email' };
  }

  async resetPassword(id: string, newPassword: string) {
    const employee = await this.employeeModel.findOne({
      _id: id,
      is_deleted: false,
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    employee.password = hashedPassword;
    await employee.save();

    // Send notification email
    await this.mailService.sendEmployeeCredentials(
      employee.emailAddress,
      employee.full_name,
      employee.user_name,
      newPassword,
      employee.isSuperAdmin,
    );

    return { message: 'Password reset successfully' };
  }

  async getStatistics() {
    const [total, working, resigned, superAdmins] = await Promise.all([
      this.employeeModel.countDocuments({ is_deleted: false }),
      this.employeeModel.countDocuments({
        is_deleted: false,
        work_status: 'Working',
      }),
      this.employeeModel.countDocuments({
        is_deleted: false,
        work_status: { $ne: 'Working' },
      }),
      this.employeeModel.countDocuments({
        is_deleted: false,
        isSuperAdmin: true,
      }),
    ]);

    return {
      total,
      working,
      resigned,
      superAdmins,
    };
  }
}
