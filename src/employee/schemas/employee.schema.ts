import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmployeeDocument = Employee & Document;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true })
  emailAddress: string;

  @Prop({ required: true })
  associates: string;

  @Prop({ type: [String], default: [] })
  roles: string[];

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, unique: true })
  user_name: string;

  @Prop({ default: '' })
  user_name_id: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  user_email: string;

  @Prop({ required: true })
  user_phone: string;

  @Prop({ default: '' })
  emergency_contact_name: string;

  @Prop({ required: true })
  emergency_contact: string;

  @Prop({ required: true })
  relationship: string;

  @Prop({ default: '' })
  aadhar_no: string;

  @Prop({ default: '' })
  google_play_id: string;

  @Prop({ required: true })
  bank_name: string;

  @Prop({ required: true })
  bank_account_no: string;

  @Prop({ required: true })
  bank_ifsc_no: string;

  @Prop({ required: true })
  joining_date: Date;

  @Prop({ default: 'Working' })
  work_status: string;

  @Prop({ default: null })
  resigned_date?: string;

  @Prop({ required: true })
  monthlySalary: string;

  @Prop({ required: true })
  date_of_birth: Date;

  @Prop({ default: '' })
  identityProofDoc: string;

  @Prop({ default: '' })
  workExperienceDoc: string;

  @Prop({ default: '' })
  educationCertificateDoc: string;

  @Prop({ default: '' })
  paySlipsDoc: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ required: true })
  created_by: string;

  @Prop({ required: true })
  updated_by: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
