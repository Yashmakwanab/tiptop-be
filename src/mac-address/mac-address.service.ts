import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MacAddress, MacAddressDocument } from './schemas/mac-address.schema';
import { CreateMacAddressDto } from './dto/create-mac-address.dto';
import { UpdateMacAddressDto } from './dto/update-mac-addressdto';
import { QueryMacAddressDto } from './dto/query-mac-address.dto';

@Injectable()
export class MacAddressService {
  constructor(
    @InjectModel(MacAddress.name)
    private macAddressModel: Model<MacAddressDocument>,
  ) {}

  async create(createMacAddressDto: CreateMacAddressDto): Promise<MacAddress> {
    const createdMacAddress = new this.macAddressModel({
      ...createMacAddressDto,
      date_entered: new Date(),
    });
    return createdMacAddress.save();
  }

  async findAll(queryDto: QueryMacAddressDto) {
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
      this.macAddressModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.macAddressModel.countDocuments(filter).exec(),
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

  async findOne(id: string): Promise<MacAddress> {
    const macAddress = await this.macAddressModel.findOne({ _id: id }).exec();

    if (!macAddress) {
      throw new NotFoundException(`Mac Address with ID ${id} not found`);
    }

    return macAddress;
  }

  async update(
    id: string,
    updateMacAddressDto: UpdateMacAddressDto,
  ): Promise<MacAddress> {
    const updatedMacAddress = await this.macAddressModel
      .findOneAndUpdate({ _id: id }, updateMacAddressDto, {
        new: true,
      })
      .exec();
    if (!updatedMacAddress) {
      throw new NotFoundException(`Mac Address with ID ${id} not found`);
    }
    return updatedMacAddress;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.macAddressModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Mac Address with ID ${id} not found`);
    }

    return { message: 'Mac Address deleted successfully' };
  }

  async removeMany(ids: string[]): Promise<{ deletedCount: number }> {
    const result = await this.macAddressModel.deleteMany({
      _id: { $in: ids },
    });

    return { deletedCount: result.deletedCount };
  }
}
