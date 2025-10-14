import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RosterService } from './roster.service';
import { RosterController } from './roster.controller';
import { Roster, RosterSchema } from './schemas/roster.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Roster.name, schema: RosterSchema }]),
  ],
  controllers: [RosterController],
  providers: [RosterService],
  exports: [RosterService],
})
export class RosterModule {}
