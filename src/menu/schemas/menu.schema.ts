import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Document, Types } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({ timestamps: true })
export class Menu {
  @Prop({ required: true })
  name: string;

  @Prop()
  icon: string;

  @Prop()
  path?: string;

  @Prop({ default: false })
  groupTitle: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Menu' })
  parentId?: Types.ObjectId;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: 0 })
  level: number;

  @Prop({ default: false })
  is_deleted: boolean;
}

export class QueryMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  created_by?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export const MenuSchema = SchemaFactory.createForClass(Menu);
