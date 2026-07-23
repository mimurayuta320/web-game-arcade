import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ScoresService } from './scores.service';

type CreateScoreBody = {
  playerName: string;
  score: number;
  game?: string;
};

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  async getScores(@Query('limit') limit?: string) {
    const parsed = Number.parseInt(limit ?? '20', 10);
    const safeLimit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 20;
    return this.scoresService.listLatest(safeLimit);
  }

  @Post()
  async createScore(@Body() body: CreateScoreBody) {
    return this.scoresService.create({
      playerName: body.playerName,
      score: body.score,
      game: body.game,
    });
  }
}
