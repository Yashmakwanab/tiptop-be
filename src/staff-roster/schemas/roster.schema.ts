import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StaffRosterDocument = StaffRoster & Document;

@Schema({ timestamps: true })
export class StaffRoster {
  @Prop({ type: Types.ObjectId, ref: 'Employee', required: true })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  roster_date: Date;

  @Prop({ type: Types.ObjectId, ref: 'Roster', required: true })
  slot_id: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['Roster', 'Week Off', 'Over Time', 'Sick Leave', 'Leave'],
    default: 'Roster',
  })
  roster_type: string;

  @Prop()
  created_by?: string;

  @Prop()
  updated_by?: string;

  @Prop({ default: false })
  is_deleted: boolean;
}

export const StaffRosterSchema = SchemaFactory.createForClass(StaffRoster);

StaffRosterSchema.index({ user_id: 1, roster_date: 1 });
StaffRosterSchema.index({ roster_date: 1 });
StaffRosterSchema.index({ slot_id: 1 });
