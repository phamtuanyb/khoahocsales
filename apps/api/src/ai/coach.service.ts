import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpAction, Prisma } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';
import { PrismaService } from '../prisma/prisma.service';
import { CoachScenariosService } from './coach-scenarios.service';
import { type CoachScenario } from './coach-scenarios';
import { OpenAiService, type ChatMessage, type AiGradingResult } from './openai.service';

const MAX_TURNS_PER_SESSION = 6;

export interface CoachMessageView {
  role: 'user' | 'assistant' | 'system';
  content: string;
  at: string;
}

export interface CoachSessionView {
  id: string;
  scenario: CoachScenario;
  transcript: CoachMessageView[];
  userTurnCount: number;
  finished: boolean;
  score: number | null;
  feedback: AiGradingResult | null;
  createdAt: string;
  endedAt: string | null;
}

@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openai: OpenAiService,
    private readonly gamification: GamificationService,
    private readonly scenarios: CoachScenariosService,
  ) {}

  async listScenarios(): Promise<CoachScenario[]> {
    return this.scenarios.listActive();
  }

  async createSession(userId: string, scenarioId: string): Promise<CoachSessionView> {
    const scenario = await this.scenarios.getOrThrow(scenarioId);
    const now = new Date().toISOString();
    const initialTranscript: CoachMessageView[] = [
      { role: 'system', content: scenario.systemPrompt, at: now },
      { role: 'assistant', content: scenario.initialMessage, at: now },
    ];

    const session = await this.prisma.aiCoachSession.create({
      data: {
        userId,
        scenario: scenarioId,
        transcript: initialTranscript as unknown as Prisma.JsonArray,
      },
    });
    return this.toView(session.id, scenario, initialTranscript, null, null, session.createdAt, null);
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    content: string,
  ): Promise<CoachSessionView> {
    const session = await this.requireSession(userId, sessionId);
    if (session.endedAt) {
      throw new BadRequestException('Phiên đã kết thúc, không gửi thêm tin nhắn được.');
    }

    const transcript = this.parseTranscript(session.transcript);
    const userTurnCount = transcript.filter((m) => m.role === 'user').length;
    if (userTurnCount >= MAX_TURNS_PER_SESSION) {
      throw new BadRequestException(
        `Phiên đã đạt giới hạn ${MAX_TURNS_PER_SESSION} lượt trả lời. Hãy bấm "Kết thúc & nhận điểm".`,
      );
    }

    const scenario = await this.scenarios.getOrThrow(session.scenario);
    transcript.push({
      role: 'user',
      content: content.trim(),
      at: new Date().toISOString(),
    });

    const aiMessages: ChatMessage[] = transcript.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const aiReply = await this.openai.chat(userId, aiMessages);

    transcript.push({
      role: 'assistant',
      content: aiReply || '(Khách hàng im lặng - thử tiếp cận khác đi.)',
      at: new Date().toISOString(),
    });

    await this.prisma.aiCoachSession.update({
      where: { id: sessionId },
      data: { transcript: transcript as unknown as Prisma.JsonArray },
    });

    return this.toView(
      sessionId,
      scenario,
      transcript,
      session.score,
      session.feedback as unknown as CoachSessionView['feedback'],
      session.createdAt,
      session.endedAt,
    );
  }

  async finishSession(userId: string, sessionId: string): Promise<CoachSessionView> {
    const session = await this.requireSession(userId, sessionId);
    if (session.endedAt) {
      const transcript = this.parseTranscript(session.transcript);
      const scenario = await this.scenarios.getOrThrow(session.scenario);
      return this.toView(
        sessionId,
        scenario,
        transcript,
        session.score,
        session.feedback as unknown as CoachSessionView['feedback'],
        session.createdAt,
        session.endedAt,
      );
    }

    const transcript = this.parseTranscript(session.transcript);
    const userMessages = transcript.filter((m) => m.role === 'user');
    if (userMessages.length === 0) {
      throw new BadRequestException(
        'Bạn chưa trả lời lượt nào. Hãy chat với khách trước khi kết thúc.',
      );
    }

    const scenario = await this.scenarios.getOrThrow(session.scenario);
    const studentAnswer = userMessages.map((m, i) => `Lượt ${i + 1}: ${m.content}`).join('\n\n');
    const grading = await this.openai.gradeSituation(userId, {
      questionContent: `Kịch bản "${scenario.name}": ${scenario.description}`,
      studentAnswer,
      rubric: scenario.successCriteria.join(' / '),
      keywords: extractKeywordsFromCriteria(scenario.successCriteria),
      scope: 'sales',
    });

    const expEarned = Math.round((grading.total / 100) * scenario.rewardExp);
    if (expEarned > 0) {
      await this.gamification.addExp({
        userId,
        action: ExpAction.AI_COACH_SESSION,
        amount: expEarned,
        refType: 'ai_coach_session',
        refId: sessionId,
        note: `AI Coach "${scenario.name}" - ${grading.total}/100`,
      });
    }

    const updated = await this.prisma.aiCoachSession.update({
      where: { id: sessionId },
      data: {
        score: grading.total,
        feedback: grading as unknown as Prisma.JsonObject,
        endedAt: new Date(),
      },
    });

    return this.toView(
      sessionId,
      scenario,
      transcript,
      updated.score,
      grading,
      updated.createdAt,
      updated.endedAt,
    );
  }

  async listSessions(userId: string): Promise<Array<{
    id: string;
    scenarioId: string;
    scenarioName: string;
    score: number | null;
    finished: boolean;
    createdAt: string;
    endedAt: string | null;
  }>> {
    const rows = await this.prisma.aiCoachSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const allScenarios = await this.scenarios.listAll();
    const scenarioMap = new Map(allScenarios.map((s) => [s.id, s]));
    return rows.map((r) => {
      const scen = scenarioMap.get(r.scenario);
      return {
        id: r.id,
        scenarioId: r.scenario,
        scenarioName: scen?.name ?? r.scenario,
        score: r.score,
        finished: r.endedAt !== null,
        createdAt: r.createdAt.toISOString(),
        endedAt: r.endedAt?.toISOString() ?? null,
      };
    });
  }

  async getSession(userId: string, sessionId: string): Promise<CoachSessionView> {
    const session = await this.requireSession(userId, sessionId);
    const transcript = this.parseTranscript(session.transcript);
    const scenario = await this.scenarios.getOrThrow(session.scenario);
    return this.toView(
      sessionId,
      scenario,
      transcript,
      session.score,
      session.feedback as unknown as CoachSessionView['feedback'],
      session.createdAt,
      session.endedAt,
    );
  }

  private async requireSession(userId: string, sessionId: string) {
    const session = await this.prisma.aiCoachSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên AI Coach');
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập phiên này');
    }
    return session;
  }

  private parseTranscript(raw: unknown): CoachMessageView[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((m) => {
      const obj = m as Record<string, unknown>;
      return {
        role: (obj.role as CoachMessageView['role']) ?? 'user',
        content: String(obj.content ?? ''),
        at: String(obj.at ?? new Date().toISOString()),
      };
    });
  }

  private toView(
    id: string,
    scenario: CoachScenario,
    transcript: CoachMessageView[],
    score: number | null,
    feedback: CoachSessionView['feedback'],
    createdAt: Date,
    endedAt: Date | null,
  ): CoachSessionView {
    const visibleTranscript = transcript
      .filter((m) => m.role !== 'system')
      .map((m) => ({ ...m, content: repairKnownMojibake(m.content) }));
    const userTurnCount = transcript.filter((m) => m.role === 'user').length;
    return {
      id,
      scenario,
      transcript: visibleTranscript,
      userTurnCount,
      finished: endedAt !== null,
      score,
      feedback: feedback ? repairFeedback(feedback) : null,
      createdAt: createdAt.toISOString(),
      endedAt: endedAt?.toISOString() ?? null,
    };
  }
}

function extractKeywordsFromCriteria(criteria: string[]): string[] {
  return criteria
    .join(' ')
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 12);
}

function repairFeedback(feedback: AiGradingResult): AiGradingResult {
  return {
    ...feedback,
    strengths: feedback.strengths.map(repairKnownMojibake),
    improvements: feedback.improvements.map(repairKnownMojibake),
    recommendedTopics: feedback.recommendedTopics.map(repairKnownMojibake),
    summary: repairKnownMojibake(feedback.summary),
  };
}

function repairKnownMojibake(value: string): string {
  return value
    .replaceAll('BÃªn', 'Bên')
    .replaceAll('chá»‰', 'chỉ')
    .replaceAll('nghÃ¬n', 'nghìn')
    .replaceAll('thÃ¡ng', 'tháng')
    .replaceAll('thÃ´i', 'thôi')
    .replaceAll('láº¡i', 'lại')
    .replaceAll('Ä‘áº¯t', 'đắt')
    .replaceAll('gáº¥p', 'gấp')
    .replaceAll('Ä‘Ã´i', 'đôi')
    .replaceAll('váº­y', 'vậy')
    .replaceAll('nÃ³i', 'nói')
    .replaceAll('cÅ©ng', 'cũng')
    .replaceAll('lÃ½', 'lý')
    .replaceAll('NhÆ°ng', 'Nhưng')
    .replaceAll('váº«n', 'vẫn')
    .replaceAll('cáº§n', 'cần')
    .replaceAll('tháº¥y', 'thấy')
    .replaceAll('minh chá»©ng', 'minh chứng')
    .replaceAll('cá»¥ thá»ƒ', 'cụ thể')
    .replaceAll('VÃ¢ng', 'Vâng')
    .replaceAll('cháº¥t lÆ°á»£ng', 'chất lượng')
    .replaceAll('con sá»‘', 'con số')
    .replaceAll('bÃ¡o giÃ¡', 'báo giá')
    .replaceAll('sáºµn sÃ ng', 'sẵn sàng')
    .replaceAll('náº¿u', 'nếu')
    .replaceAll('sáº½', 'sẽ')
    .replaceAll('chuyá»ƒn', 'chuyển')
    .replaceAll('TÃ´i', 'Tôi')
    .replaceAll('CÃ³', 'Có')
    .replaceAll('tÄƒng', 'tăng')
    .replaceAll('Äá»ƒ', 'Để')
    .replaceAll('suy nghÄ©', 'suy nghĩ')
    .replaceAll('pháº£n há»“i', 'phản hồi')
    .replaceAll('Táº¡m dá»«ng', 'Tạm dừng')
    .replaceAll('Ä‘ang', 'đang')
    .replaceAll('xÃ i', 'xài')
    .replaceAll('pháº§n má»m', 'phần mềm')
    .replaceAll('rá»“i', 'rồi')
    .replaceAll('pháº£i', 'phải')
    .replaceAll('Ä‘á»•i', 'đổi')
    .replaceAll('váº» á»•n', 'vẻ ổn')
    .replaceAll('sá»£', 'sợ')
    .replaceAll('ráº¥t', 'rất')
    .replaceAll('máº¥t', 'mất')
    .replaceAll('cÃ´ng', 'công')
    .replaceAll('BÃªn Ä‘Ã³', 'Bên đó')
    .replaceAll('lÃ m Ä‘Æ°á»£c', 'làm được')
    .replaceAll('KhÃ¡c biá»‡t', 'Khác biệt')
    .replaceAll('ÄÆ°á»£c', 'Được')
    .replaceAll('phÃºt', 'phút')
    .replaceAll('tuáº§n', 'tuần')
    .replaceAll('xem nhÃ©', 'xem nhé')
    .replaceAll('ChÆ°a', 'Chưa')
    .replaceAll('Ä‘iá»ƒm', 'điểm')
    .replaceAll('Ä‘á»§', 'đủ')
    .replaceAll('thuyáº¿t phá»¥c', 'thuyết phục')
    .replaceAll('cÃ¢n nháº¯c', 'cân nhắc')
    .replaceAll('hay Ä‘áº¥y', 'hay đấy')
    .replaceAll('Ä‘á»ƒ', 'để')
    .replaceAll('vÃ i hÃ´m', 'vài hôm')
    .replaceAll('Ä‘Ã£', 'đã')
    .replaceAll('quyáº¿t', 'quyết')
    .replaceAll('giá»¯ lá»‹ch', 'giữ lịch')
    .replaceAll('giÃºp', 'giúp')
    .replaceAll('nghÄ©a', 'nghĩa')
    .replaceAll('vÃ i', 'vài')
    .replaceAll('KhÃ´ng', 'Không')
    .replaceAll('vá»™i', 'vội')
    .replaceAll('Cáº£m Æ¡n', 'Cảm ơn')
    .replaceAll('háº¹n gáº·p', 'hẹn gặp')
    .replaceAll('tiáº¿p Ä‘i', 'tiếp đi')
    .replaceAll('nghe', 'nghe')
    .replaceAll('Cháº¥m STUB', 'Chấm STUB')
    .replaceAll('Tá»•ng Ä‘iá»ƒm', 'Tổng điểm')
    .replaceAll('Tráº£ lá»i', 'Trả lời')
    .replaceAll('Ä‘Ã¡p á»©ng', 'đáp ứng')
    .replaceAll('yÃªu cáº§u', 'yêu cầu')
    .replaceAll('Cáº§n Ã´n', 'Cần ôn')
    .replaceAll('cháº·t hÆ¡n', 'chặt hơn');
}
