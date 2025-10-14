import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Roster, RosterDocument } from './schemas/roster.schema';
import { CreateRosterDto } from './dto/create-roster.dto';
import { UpdateRosterDto } from './dto/update-roster.dto';
import { QueryRosterDto } from './dto/query-roster.dto';

@Injectable()
export class RosterService {
  constructor(
    @InjectModel(Roster.name) private rosterModel: Model<RosterDocument>,
  ) {}

  async create(createRosterDto: CreateRosterDto): Promise<Roster> {
    const createdRoster = new this.rosterModel({
      ...createRosterDto,
      date_entered: new Date(),
      is_deleted: false,
    });
    return createdRoster.save();
  }

  async findAll(queryDto: QueryRosterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      created_by,
      total_hrs,
      sortBy = 'date_entered',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: Record<string, any> = { is_deleted: false };

    if (search) {
      filter.$or = [
        { start_time: { $regex: search, $options: 'i' } },
        { end_time: { $regex: search, $options: 'i' } },
      ];
    }

    if (created_by) {
      filter.created_by = created_by;
    }

    if (total_hrs) {
      filter.total_hrs = total_hrs;
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.rosterModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.rosterModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Roster> {
    const roster = await this.rosterModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!roster) {
      throw new NotFoundException(`Roster with ID ${id} not found`);
    }

    return roster;
  }

  async update(id: string, updateRosterDto: UpdateRosterDto): Promise<Roster> {
    const updatedRoster = await this.rosterModel
      .findOneAndUpdate({ _id: id, is_deleted: false }, updateRosterDto, {
        new: true,
      })
      .exec();
    if (!updatedRoster) {
      throw new NotFoundException(`Roster with ID ${id} not found`);
    }
    return updatedRoster;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.rosterModel
      .findOneAndUpdate(
        { _id: id, is_deleted: false },
        { is_deleted: true },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException(`Roster with ID ${id} not found`);
    }

    return { message: 'Roster deleted successfully' };
  }

  async permanentDelete(id: string): Promise<{ message: string }> {
    const result = await this.rosterModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Roster with ID ${id} not found`);
    }

    return { message: 'Roster permanently deleted' };
  }

  async removeMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.rosterModel
      .updateMany(
        { _id: { $in: ids }, is_deleted: false },
        { is_deleted: true },
      )
      .exec();

    return { deletedCount: result.modifiedCount };
  }
}
