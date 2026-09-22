import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { RobotsModule } from './robots/robots.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, RobotsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
