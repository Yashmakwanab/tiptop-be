import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  Employee,
  EmployeeDocument,
} from '../employee/schemas/employee.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Employee.name) private employeeModel: Model<EmployeeDocument>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstname, lastname } = registerDto;

    // Check if user exists
    const existingUser = await this.employeeModel.findOne({
      emailAddress: email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create employee/user
    const employee = new this.employeeModel({
      emailAddress: email,
      password: hashedPassword,
      full_name: firstname,
      firstName: firstname,
      lastName: lastname,
      user_email: email,
      user_name: email.split('@')[0],
      associates: 'N/A',
      address: 'N/A',
      country: 'N/A',
      user_phone: '0000000000',
      emergency_contact: '0000000000',
      relationship: 'N/A',
      bank_name: 'N/A',
      bank_account_no: 'N/A',
      bank_ifsc_no: 'N/A',
      joining_date: new Date(),
      monthlySalary: '0',
      date_of_birth: new Date(),
      category: 'N/A',
      created_by: 'self',
      updated_by: 'self',
      isSuperAdmin: false,
      isActive: true,
    });

    await employee.save();

    // Generate token
    const token = this.generateToken(employee);

    return {
      access_token: token,
      user: {
        id: employee._id,
        email: employee.emailAddress,
        name: employee.full_name,
        isSuperAdmin: employee.isSuperAdmin,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find employee
    const employee = await this.employeeModel.findOne({
      emailAddress: email,
      is_deleted: false,
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If super admin, login directly
    if (employee.isSuperAdmin) {
      const token = this.generateToken(employee);
      return {
        access_token: token,
        user: {
          id: employee._id,
          email: employee.emailAddress,
          name: employee.full_name,
          isSuperAdmin: employee.isSuperAdmin,
        },
        requireOtp: false,
      };
    }

    // For regular employees, generate and send OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    employee.otp = await bcrypt.hash(otp, 10);
    employee.otpExpiry = otpExpiry;
    await employee.save();

    // Send OTP via email
    await this.mailService.sendOTP(
      employee.emailAddress,
      employee.full_name,
      otp,
    );

    return {
      requireOtp: true,
      email: employee.emailAddress,
      message: 'OTP has been sent to your email',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const employee = await this.employeeModel.findOne({
      emailAddress: email,
      is_deleted: false,
      isActive: true,
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!employee.otp || !employee.otpExpiry) {
      throw new BadRequestException(
        'No OTP request found. Please login again.',
      );
    }

    // Check if OTP expired
    if (new Date() > employee.otpExpiry) {
      throw new BadRequestException('OTP has expired. Please login again.');
    }

    // Verify OTP
    const isOtpValid = await bcrypt.compare(otp, employee.otp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP after successful verification
    employee.otp = '';
    await employee.save();

    // Generate token
    const token = this.generateToken(employee);

    return {
      access_token: token,
      user: {
        id: employee._id,
        email: employee.emailAddress,
        name: employee.full_name,
        isSuperAdmin: employee.isSuperAdmin,
      },
    };
  }

  async resendOtp(email: string) {
    const employee = await this.employeeModel.findOne({
      emailAddress: email,
      is_deleted: false,
      isActive: true,
    });

    if (!employee) {
      throw new UnauthorizedException('Invalid email');
    }

    if (employee.isSuperAdmin) {
      throw new BadRequestException('Super admins do not require OTP');
    }

    // Generate new OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

    employee.otp = await bcrypt.hash(otp, 10);
    employee.otpExpiry = otpExpiry;
    await employee.save();

    // Send OTP via email
    await this.mailService.sendOTP(
      employee.emailAddress,
      employee.full_name,
      otp,
    );

    return {
      message: 'OTP has been resent to your email',
    };
  }

  async getProfile(userId: string) {
    const employee = await this.employeeModel
      .findById(userId)
      .select('-password -otp');
    if (!employee) {
      throw new UnauthorizedException();
    }
    return employee;
  }

  private generateToken(employee: EmployeeDocument): string {
    const payload = {
      email: employee.emailAddress,
      sub: employee._id,
      isSuperAdmin: employee.isSuperAdmin,
    };
    return this.jwtService.sign(payload);
  }
}
