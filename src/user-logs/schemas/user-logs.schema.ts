import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserLogsDocument = UserLogs & Document;

@Schema({ timestamps: true })
export class UserLogs {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  username: string;

  @Prop()
  bookingId?: string;

  @Prop()
  taskId?: string;

  @Prop()
  customerName?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  module: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const UserLogsSchema = SchemaFactory.createForClass(UserLogs);
