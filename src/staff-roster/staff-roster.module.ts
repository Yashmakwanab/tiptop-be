import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffRosterService } from './staff-roster.service';
import { StaffRosterController } from './staff-roster.controller';
import { EmployeeSchema } from '../employee/schemas/employee.schema';
import { RosterSchema } from '../roster/schemas/roster.schema';
import { StaffRoster, StaffRosterSchema } from './schemas/roster.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffRoster.name, schema: StaffRosterSchema },
      { name: 'Employee', schema: EmployeeSchema },
      { name: 'Roster', schema: RosterSchema },
    ]),
  ],
  controllers: [StaffRosterController],
  providers: [StaffRosterService],
  exports: [StaffRosterService],
})
export class StaffRosterModule {}
