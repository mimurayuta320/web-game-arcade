import { Injectable } from '@nestjs/common';
import { CloudService } from '../cloud/cloud.service';

type CreateScoreInput = {
  playerName: string;
  score: number;
  game?: string;
  maxScore?: number;
  rank?: 'S' | 'A' | 'B' | 'C';
};

@Injectable()
export class ScoresService {
  constructor(private readonly cloudService: CloudService) {}

  async create(input: CreateScoreInput) {
    return this.cloudService.createScore({
      playerName: input.playerName,
      score: input.score,
      game: input.game,
      maxScore: input.maxScore,
      rank: input.rank,
    });
  }

  async listLatest(limit = 20) {
    return this.cloudService.listLatestScores(limit);
  }
}
