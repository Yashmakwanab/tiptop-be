import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { MailModule } from './mail/mail.module';
import { RosterModule } from './roster/roster.module';
import { StaffRosterModule } from './staff-roster/staff-roster.module';
import { MenuModule } from './menu/menu.module';
import { RoleModule } from './role/role.module';
import { RolePermissionModule } from './role-permission/role-permission.module';
import { UserLogsModule } from './user-logs/user-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    EmployeeModule,
    MailModule,
    RosterModule,
    StaffRosterModule,
    MenuModule,
    RoleModule,
    RolePermissionModule,
    UserLogsModule,
  ],
})
export class AppModule {}
