import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsDateString,
  IsBoolean,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  associates: string;

  @IsArray()
  @IsOptional()
  roles?: string[];

  @IsString()
  @IsNotEmpty()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  user_name: string;

  @IsString()
  user_name_id: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsEmail()
  @IsNotEmpty()
  user_email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,15}$/, { message: 'Invalid phone number' })
  user_phone: string;

  @IsString()
  @IsOptional()
  emergency_contact_name?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{10,15}$/, { message: 'Invalid emergency contact' })
  emergency_contact: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsString()
  @IsOptional()
  aadhar_no?: string;

  @IsString()
  @IsOptional()
  google_play_id?: string;

  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @IsString()
  @IsNotEmpty()
  bank_account_no: string;

  @IsString()
  @IsNotEmpty()
  bank_ifsc_no: string;

  @IsDateString()
  @IsNotEmpty()
  joining_date: string;

  @IsString()
  @IsOptional()
  work_status?: string;

  @IsString()
  @IsOptional()
  resigned_date?: string;

  @IsString()
  @IsNotEmpty()
  monthlySalary: string;

  @IsDateString()
  @IsNotEmpty()
  date_of_birth: string;

  @IsString()
  @IsOptional()
  identityProofDoc?: string;

  @IsString()
  @IsOptional()
  workExperienceDoc?: string;

  @IsString()
  @IsOptional()
  educationCertificateDoc?: string;

  @IsString()
  @IsOptional()
  paySlipsDoc?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsBoolean()
  @IsOptional()
  is_deleted?: boolean;

  @IsString()
  @IsOptional()
  created_by?: string;

  @IsString()
  @IsOptional()
  updated_by?: string;
}
