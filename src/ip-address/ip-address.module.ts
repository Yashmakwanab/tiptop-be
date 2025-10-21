import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IpAddressService } from './ip-address.service';
import { IpAddressController } from './ip-address.controller';
import { IpAddress, IpAddressSchema } from './schemas/ip-address.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IpAddress.name, schema: IpAddressSchema },
    ]),
  ],
  controllers: [IpAddressController],
  providers: [IpAddressService],
  exports: [IpAddressService],
})
export class IpAddressModule {}
