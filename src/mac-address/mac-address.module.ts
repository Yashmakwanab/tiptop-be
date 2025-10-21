import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MacAddressService } from './mac-address.service';
import { MacAddressController } from './mac-address.controller';
import { MacAddress, MacAddressSchema } from './schemas/mac-address.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MacAddress.name, schema: MacAddressSchema },
    ]),
  ],
  controllers: [MacAddressController],
  providers: [MacAddressService],
  exports: [MacAddressService],
})
export class MacAddressModule {}
