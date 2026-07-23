import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudModule } from './cloud/cloud.module';
import { ScoresModule } from './scores/scores.module';

@Module({
  imports: [CloudModule, ScoresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
