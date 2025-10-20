import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

// ----------------------
// Role Schema
// ----------------------
export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  created_by: string;

  @Prop()
  updated_by?: string;

  @Prop({ default: false })
  is_deleted: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// ----------------------
// RolePermission Schema
// ----------------------
export type RolePermissionDocument = RolePermission & Document;

export class RolePermission {
  roleId: MongooseSchema.Types.ObjectId;
  menuId: MongooseSchema.Types.ObjectId;
  menuKey?: MongooseSchema.Types.ObjectId;
  menuName?: string;
  created_by?: string;
  is_deleted?: boolean;
}

export const RolePermissionSchema = new MongooseSchema(
  {
    roleId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    menuId: {
      type: MongooseSchema.Types.ObjectId,
      ref: 'Menu',
      required: true,
    },
    menuKey: { type: MongooseSchema.Types.ObjectId },
    menuName: { type: String },
    created_by: { type: String },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);
