import { IsObject, IsNotEmpty } from 'class-validator';

export class SubmitQuizDto {
  // Map questionId → answer payload (cấu trúc tùy type, parse trong service).
  @IsObject()
  @IsNotEmpty()
  answers!: Record<string, unknown>;
}
