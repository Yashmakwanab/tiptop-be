import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLogs } from './schemas/user-logs.schema';
import { QueryStaffRosterDto } from 'src/staff-roster/dto/query-staff-roster.dto';

@Injectable()
export class UserLogsService {
  constructor(
    @InjectModel(UserLogs.name) private readonly userLogsModel: Model<UserLogs>,
  ) {}

  async createLog(data: {
    userId: string;
    username: string;
    bookingId?: string;
    taskId?: string;
    customerName?: string;
    description: string;
    module: string;
  }) {
    const newLog = new this.userLogsModel(data);
    return newLog.save();
  }

  async findAll(queryDto: QueryStaffRosterDto) {
    const { page = 1, limit = 10, search } = queryDto;

    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch paginated data
    const [data, total] = await Promise.all([
      this.userLogsModel
        .find(query)
        .sort({ dateCreated: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userLogsModel.countDocuments(query),
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

  async findByUser(userId: string) {
    return this.userLogsModel.find({ userId }).sort({ dateCreated: -1 }).exec();
  }
}
