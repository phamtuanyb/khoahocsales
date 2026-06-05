import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/jwt-payload.interface';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { QuizService } from './quiz.service';

@Controller('quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  // GET /api/v1/quizzes/:id — đề thi đã sanitize (không kèm đáp án).
  @Get(':id')
  getQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.quizService.getQuiz(user.id, id);
  }

  // POST /api/v1/quizzes/:id/submit — nộp bài, chấm, cộng EXP, check Level Up.
  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submitQuiz(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizService.submitQuiz(user.id, id, dto.answers);
  }
}
