import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RosterDocument = Roster & Document;

@Schema({ timestamps: true })
export class Roster {
  @Prop({ required: true })
  start_time: string;

  @Prop({ required: true })
  end_time: string;

  @Prop({ required: true })
  total_hrs: string;

  @Prop({ required: true })
  created_by: string;

  @Prop({ default: () => new Date() })
  date_entered: Date;

  @Prop()
  updated_by?: string;

  @Prop({ default: false })
  is_deleted: boolean;
}

export const RosterSchema = SchemaFactory.createForClass(Roster);
