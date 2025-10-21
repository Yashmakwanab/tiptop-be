import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IpAddressDocument = IpAddress & Document;

@Schema({ timestamps: true })
export class IpAddress {
  @Prop()
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ default: () => new Date() })
  date_entered: Date;

  @Prop({ required: true })
  created_by: string;

  @Prop()
  updated_by?: string;
}

export const IpAddressSchema = SchemaFactory.createForClass(IpAddress);
