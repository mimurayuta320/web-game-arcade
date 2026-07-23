import { Module } from '@nestjs/common';
import { CloudModule } from '../cloud/cloud.module';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';

@Module({
  imports: [CloudModule],
  controllers: [ScoresController],
  providers: [ScoresService],
})
export class ScoresModule {}
