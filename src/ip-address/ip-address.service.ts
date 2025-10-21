import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IpAddress, IpAddressDocument } from './schemas/ip-address.schema';
import { CreateIpAddressDto } from './dto/create-ip-address.dto';
import { UpdateIpAddressDto } from './dto/update-ip-addressdto';
import { QueryIpAddressDto } from './dto/query-ip-address.dto';

@Injectable()
export class IpAddressService {
  constructor(
    @InjectModel(IpAddress.name)
    private ipAddressModel: Model<IpAddressDocument>,
  ) {}

  async create(createIpAddressDto: CreateIpAddressDto): Promise<IpAddress> {
    const createdIpAddress = new this.ipAddressModel({
      ...createIpAddressDto,
      date_entered: new Date(),
    });
    return createdIpAddress.save();
  }

  async findAll(queryDto: QueryIpAddressDto) {
    const {
      page = 1,
      limit = 10,
      search,
      created_by,
      sortBy = 'date_entered',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }

    if (created_by) {
      filter.created_by = created_by;
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [data, total] = await Promise.all([
      this.ipAddressModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ipAddressModel.countDocuments(filter).exec(),
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

  async findOne(id: string): Promise<IpAddress> {
    const ipAddress = await this.ipAddressModel.findOne({ _id: id }).exec();

    if (!ipAddress) {
      throw new NotFoundException(`Ip Address with ID ${id} not found`);
    }

    return ipAddress;
  }

  async update(
    id: string,
    updateIpAddressDto: UpdateIpAddressDto,
  ): Promise<IpAddress> {
    const updatedIpAddress = await this.ipAddressModel
      .findOneAndUpdate({ _id: id }, updateIpAddressDto, {
        new: true,
      })
      .exec();
    if (!updatedIpAddress) {
      throw new NotFoundException(`Ip Address with ID ${id} not found`);
    }
    return updatedIpAddress;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.ipAddressModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Ip Address with ID ${id} not found`);
    }

    return { message: 'Ip Address deleted successfully' };
  }

  async removeMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.ipAddressModel.deleteMany({
      _id: { $in: ids },
    });

    return { deletedCount: result.deletedCount };
  }
}
