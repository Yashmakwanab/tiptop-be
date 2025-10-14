import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  FilterQuery,
  HydratedDocument,
  Model,
  QuerySelector,
  Types,
} from 'mongoose';
import { CreateStaffRosterDto } from './dto/create-staff-roster.dto';
import { UpdateStaffRosterDto } from './dto/update-staff-roster.dto';
import { QueryStaffRosterDto } from './dto/query-staff-roster.dto';
import { StaffRoster, StaffRosterDocument } from './schemas/roster.schema';
import { Employee } from 'src/employee/schemas/employee.schema';
import { Roster } from 'src/roster/schemas/roster.schema';

interface PopulatedUser {
  _id: Types.ObjectId | string;
  firstName?: string;
  lastName?: string;
  user_name?: string;
}

interface PopulatedSlot {
  _id: Types.ObjectId | string;
  start_time?: string;
  end_time?: string;
  total_hrs?: string;
}

type PopulatedStaffRoster = HydratedDocument<StaffRoster> & {
  user_id: PopulatedUser;
  slot_id: PopulatedSlot;
};

interface PopulatedRoster {
  _id: Types.ObjectId | string;
  user_id: {
    _id: Types.ObjectId | string;
    firstName?: string;
    lastName?: string;
    user_name?: string;
  } | null;
  slot_id: {
    _id: Types.ObjectId | string;
    start_time?: string;
    end_time?: string;
    total_hrs?: string;
  } | null;
  roster_date: Date;
  roster_type: string;
  created_by?: string;
  updated_by?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ByTypeItem {
  _id: string;
  count: number;
}

export interface ByTypeCount {
  [key: string]: number;
}

export interface StaffRosterResponseDto {
  _id: string;
  user_id: string;
  user_name: string;
  full_name: string;
  slot_id: string;
  start_time: string;
  end_time: string;
  total_hrs: string;
  roster_date: Date;
  roster_type: string;
  created_by: string;
  updated_by: string;
}

@Injectable()
export class StaffRosterService {
  constructor(
    @InjectModel(StaffRoster.name)
    private staffRosterModel: Model<StaffRosterDocument>,
    @InjectModel('Employee')
    private employeeModel: Model<Employee>,
    @InjectModel('Roster')
    private rosterModel: Model<Roster>,
  ) {}

  async create(createDto: CreateStaffRosterDto): Promise<StaffRoster[]> {
    const { user_id, roster_dates, slot_id, roster_type, created_by } =
      createDto;

    // Validate user exists
    const userExists = await this.employeeModel.findById(user_id).exec();
    if (!userExists) {
      throw new NotFoundException(`User with ID ${user_id} not found`);
    }

    // Validate slot exists
    const slotExists = await this.rosterModel.findById(slot_id).exec();
    if (!slotExists) {
      throw new NotFoundException(`Slot with ID ${slot_id} not found`);
    }

    // Check for duplicate entries
    const existingRosters = await this.staffRosterModel
      .find({
        user_id: new Types.ObjectId(user_id),
        roster_date: { $in: roster_dates.map((d) => new Date(d)) },
        is_deleted: false,
      })
      .exec();

    if (existingRosters.length > 0) {
      const existingDates = existingRosters.map(
        (r) => r.roster_date.toISOString().split('T')[0],
      );
      throw new BadRequestException(
        `Roster already exists for dates: ${existingDates.join(', ')}`,
      );
    }

    // Create multiple roster entries
    const rosterEntries = roster_dates.map((date) => ({
      user_id: new Types.ObjectId(user_id),
      roster_date: new Date(date),
      slot_id: new Types.ObjectId(slot_id),
      roster_type: roster_type || 'Roster',
      created_by,
      is_deleted: false,
    }));

    const createdRosters =
      await this.staffRosterModel.insertMany(rosterEntries);
    return createdRosters;
  }

  async findAll(queryDto: QueryStaffRosterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      user_id,
      roster_type,
      start_date,
      end_date,
      sortBy = 'roster_date',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: FilterQuery<StaffRoster> = { is_deleted: false };

    if (user_id) {
      filter.user_id = new Types.ObjectId(user_id);
    }

    if (roster_type) {
      filter.roster_type = roster_type;
    }

    if (start_date || end_date) {
      const rosterDateFilter: QuerySelector<Date> = {};
      if (start_date) rosterDateFilter.$gte = new Date(start_date);
      if (end_date) rosterDateFilter.$lte = new Date(end_date);
      filter.roster_date = rosterDateFilter;
    }

    if (search) {
      filter.$or = [
        { start_time: { $regex: search, $options: 'i' } },
        { end_time: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries with population
    const [data, total] = await Promise.all([
      this.staffRosterModel
        .find(filter)
        .populate({
          path: 'user_id',
          select: 'firstName lastName user_name emailAddress',
        })
        .populate({
          path: 'slot_id',
          select: 'start_time end_time total_hrs',
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.staffRosterModel.countDocuments(filter).exec(),
    ]);

    // Format response with populated data
    const formattedData = (data as unknown as PopulatedRoster[]).map(
      (roster) => ({
        _id: roster._id,
        user_id: roster.user_id?._id ?? null,
        user_name: roster.user_id?.user_name ?? 'N/A',
        full_name:
          `${roster.user_id?.firstName ?? ''} ${roster.user_id?.lastName ?? ''}`.trim() ||
          'N/A',
        roster_date: roster.roster_date,
        slot_id: roster.slot_id?._id ?? null,
        start_time: roster.slot_id?.start_time ?? 'N/A',
        end_time: roster.slot_id?.end_time ?? 'N/A',
        total_hrs: roster.slot_id?.total_hrs ?? 'N/A',
        roster_type: roster.roster_type,
        created_by: roster.created_by ?? 'N/A',
        updated_by: roster.updated_by ?? 'N/A',
        createdAt: roster.createdAt,
        updatedAt: roster.updatedAt,
      }),
    );

    return {
      data: formattedData,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const rosterDoc = (await this.staffRosterModel
      .findOne({ _id: id, is_deleted: false })
      .populate('user_id', 'firstName lastName user_name emailAddress')
      .populate('slot_id', 'start_time end_time total_hrs')
      .exec()) as PopulatedRoster | null;

    if (!rosterDoc) {
      throw new NotFoundException(`Staff roster with ID ${id} not found`);
    }

    return {
      _id: rosterDoc._id,
      user_id: rosterDoc.user_id?._id ?? null,
      user_name: rosterDoc.user_id?.user_name ?? 'N/A',
      full_name:
        `${rosterDoc.user_id?.firstName ?? ''} ${rosterDoc.user_id?.lastName ?? ''}`.trim() ||
        'N/A',
      roster_date: rosterDoc.roster_date,
      slot_id: rosterDoc.slot_id?._id ?? null,
      start_time: rosterDoc.slot_id?.start_time ?? 'N/A',
      end_time: rosterDoc.slot_id?.end_time ?? 'N/A',
      total_hrs: rosterDoc.slot_id?.total_hrs ?? 'N/A',
      roster_type: rosterDoc.roster_type,
      created_by: rosterDoc.created_by ?? 'N/A',
      updated_by: rosterDoc.updated_by ?? 'N/A',
    };
  }

  async update(
    id: string,
    updateDto: UpdateStaffRosterDto,
  ): Promise<StaffRosterResponseDto> {
    // Convert string IDs to ObjectId before assigning to updateData
    const updateData: Partial<StaffRoster> = {};

    if (updateDto.user_id) {
      updateData.user_id = new Types.ObjectId(updateDto.user_id);
    }

    if (updateDto.slot_id) {
      updateData.slot_id = new Types.ObjectId(updateDto.slot_id);
    }

    if (updateDto.roster_date) {
      updateData.roster_date =
        typeof updateDto.roster_date === 'string'
          ? new Date(updateDto.roster_date)
          : updateDto.roster_date;
    }

    if (updateDto.roster_type) {
      updateData.roster_type = updateDto.roster_type;
    }

    if (updateDto.updated_by) {
      updateData.updated_by = updateDto.updated_by;
    }

    const updatedRoster = (await this.staffRosterModel
      .findOneAndUpdate({ _id: id, is_deleted: false }, updateData, {
        new: true,
      })
      .populate('user_id', 'firstName lastName user_name')
      .populate('slot_id', 'start_time end_time total_hrs')
      .exec()) as PopulatedStaffRoster | null;

    if (!updatedRoster) {
      throw new NotFoundException(`Staff roster with ID ${id} not found`);
    }

    return {
      _id: updatedRoster._id.toString(),
      user_id: updatedRoster.user_id._id.toString(),
      user_name: updatedRoster.user_id?.user_name ?? 'N/A',
      full_name:
        `${updatedRoster.user_id?.firstName ?? ''} ${updatedRoster.user_id?.lastName ?? ''}`.trim() ||
        'N/A',
      slot_id: updatedRoster.slot_id._id.toString(),
      start_time: updatedRoster.slot_id?.start_time ?? 'N/A',
      end_time: updatedRoster.slot_id?.end_time ?? 'N/A',
      total_hrs: updatedRoster.slot_id?.total_hrs ?? 'N/A',
      roster_date: updatedRoster.roster_date,
      roster_type: updatedRoster.roster_type,
      created_by: updatedRoster.created_by ?? 'N/A',
      updated_by: updatedRoster.updated_by ?? 'N/A',
    };
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.staffRosterModel
      .findOneAndUpdate(
        { _id: id, is_deleted: false },
        { is_deleted: true },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException(`Staff roster with ID ${id} not found`);
    }

    return { message: 'Staff roster deleted successfully' };
  }

  async removeMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.staffRosterModel
      .updateMany(
        { _id: { $in: ids }, is_deleted: false },
        { is_deleted: true },
      )
      .exec();

    return { deletedCount: result.modifiedCount };
  }

  async getStatistics() {
    const [total, byType] = await Promise.all([
      this.staffRosterModel.countDocuments({ is_deleted: false }).exec(),
      this.staffRosterModel
        .aggregate([
          { $match: { is_deleted: false } },
          { $group: { _id: '$roster_type', count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    const byTypeTyped: ByTypeItem[] = byType as ByTypeItem[];

    return {
      total,
      byType: byTypeTyped.reduce<ByTypeCount>((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as ByTypeCount),
    };
  }
}
