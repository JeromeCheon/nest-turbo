import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { RobotsModule } from './robots/robots.module';

@Module({
  imports: [AuthModule, RobotsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
