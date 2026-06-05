import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCoachSessionDto {
  // Validate exist trong service (DB-driven).
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  scenario!: string;
}

export class SendCoachMessageDto {
  @IsString()
  @MinLength(1, { message: 'Câu trả lời không được rỗng' })
  @MaxLength(2000, { message: 'Câu trả lời tối đa 2000 ký tự' })
  content!: string;
}
