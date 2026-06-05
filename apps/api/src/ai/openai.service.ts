import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiSettingsService } from './ai-settings.service';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GradeInput {
  questionContent: string;
  studentAnswer: string;
  rubric?: string;
  keywords?: string[];
  scope?: string;
}

export interface AiGradingResult {
  attitude: number;
  logic: number;
  sopCompliance: number;
  total: number;
  strengths: string[];
  improvements: string[];
  recommendedTopics: string[];
  summary: string;
}

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private clientCache: { cacheKey: string; client: OpenAI } | null = null;
  private readonly usage = new Map<string, { dateKey: string; count: number }>();

  constructor(
    private readonly config: ConfigService,
    private readonly aiSettings: AiSettingsService,
  ) {
    const apiKey = config.get<string>('OPENAI_API_KEY') ?? '';
    const stubMode = !apiKey || apiKey.startsWith('sk-replace') || apiKey === 'sk-...';
    if (stubMode) {
      this.logger.warn('OpenAI env key is missing. Runtime settings may still provide a database key.');
    } else {
      this.logger.log('OpenAI env key detected');
    }
  }

  async chat(userId: string, messages: ChatMessage[]): Promise<string> {
    const runtime = await this.aiSettings.getRuntime('coach');
    this.enforceRateLimit(userId, runtime.dailyLimit);

    if (!runtime.apiKey) {
      return this.stubChat(messages);
    }

    try {
      if (runtime.provider === 'gemini') {
        return await this.geminiGenerate(runtime.apiKey, runtime.model, messages, {
          maxTokens: runtime.maxTokens,
          temperature: 0.7,
        });
      }

      const response = await this.getOpenAiClient(runtime.apiKey, runtime.model).chat.completions.create({
        model: runtime.model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: runtime.maxTokens,
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content?.trim() ?? '';
    } catch (err) {
      this.logger.error('AI chat error', err as Error);
      throw aiProviderException(runtime.provider, err);
    }
  }

  async gradeSituation(userId: string, input: GradeInput): Promise<AiGradingResult> {
    const runtime = await this.aiSettings.getRuntime('grading');
    this.enforceRateLimit(userId, runtime.dailyLimit);

    if (!runtime.apiKey) {
      return this.stubGrade(input);
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: GRADING_SYSTEM_PROMPT },
      { role: 'user', content: this.buildGradingPrompt(input) },
    ];

    try {
      const raw =
        runtime.provider === 'gemini'
          ? await this.geminiGenerate(runtime.apiKey, runtime.model, messages, {
              maxTokens: 800,
              temperature: 0.3,
            })
          : (
              await this.getOpenAiClient(runtime.apiKey, runtime.model).chat.completions.create({
                model: runtime.model,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                max_tokens: 800,
                temperature: 0.3,
                response_format: { type: 'json_object' },
              })
            ).choices[0]?.message?.content ?? '{}';

      return this.parseGradingResult(raw);
    } catch (err) {
      this.logger.error('AI grade error', err as Error);
      throw aiProviderException(runtime.provider, err);
    }
  }

  private getOpenAiClient(apiKey: string, model: string): OpenAI {
    const cacheKey = `${apiKey}:${model}`;
    if (this.clientCache?.cacheKey !== cacheKey) {
      this.clientCache = { cacheKey, client: new OpenAI({ apiKey }) };
      this.logger.log(`OpenAI active; model=${model}`);
    }
    return this.clientCache.client;
  }

  private async geminiGenerate(
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    config: { maxTokens: number; temperature: number },
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: messages
                .filter((m) => m.role === 'system')
                .map((m) => m.content)
                .join('\n\n'),
            },
          ],
        },
        contents: messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        generationConfig: {
          maxOutputTokens: config.maxTokens,
          temperature: config.temperature,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Gemini error ${response.status}: ${detail.slice(0, 500)}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return (
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim() ?? ''
    );
  }

  private enforceRateLimit(userId: string, dailyLimitPerUser: number): void {
    const dateKey = new Date().toISOString().slice(0, 10);
    const cur = this.usage.get(userId);
    if (!cur || cur.dateKey !== dateKey) {
      this.usage.set(userId, { dateKey, count: 1 });
      return;
    }
    if (cur.count >= dailyLimitPerUser) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Bạn đã dùng hết ${dailyLimitPerUser} lượt AI hôm nay. Vui lòng quay lại sau 00:00.`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    cur.count += 1;
  }

  private buildGradingPrompt(input: GradeInput): string {
    const kw = input.keywords?.length
      ? `Từ khóa SOP mong đợi: ${input.keywords.join(', ')}`
      : '';
    return [
      'Đánh giá câu trả lời của nhân viên Sales theo 3 tiêu chí:',
      '1. Thái độ (trọng số 30%): bình tĩnh, đồng cảm, chuyên nghiệp, tôn trọng khách.',
      '2. Logic xử lý (35%): trình tự hợp lý, giải quyết đúng vấn đề cốt lõi.',
      '3. Đúng SOP MKT (35%): áp dụng LAARC, F-B-V, không hạ giá tùy tiện.',
      '',
      `Câu hỏi tình huống: ${input.questionContent}`,
      `Câu trả lời nhân viên: ${input.studentAnswer}`,
      input.rubric ? `Tham chiếu rubric: ${input.rubric}` : '',
      kw,
      '',
      'Trả về JSON DUY NHẤT theo schema:',
      '{',
      '  "attitude": <0-100>,',
      '  "logic": <0-100>,',
      '  "sopCompliance": <0-100>,',
      '  "total": <0-100, = attitude*0.3 + logic*0.35 + sopCompliance*0.35, làm tròn>,',
      '  "strengths": ["...", "...", "..."],',
      '  "improvements": ["...", "..."],',
      '  "recommendedTopics": ["..."],',
      '  "summary": "1-2 câu tổng kết bằng tiếng Việt"',
      '}',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private parseGradingResult(raw: string): AiGradingResult {
    try {
      const parsed = JSON.parse(extractJson(raw)) as Partial<AiGradingResult>;
      const attitude = clamp(num(parsed.attitude, 0), 0, 100);
      const logic = clamp(num(parsed.logic, 0), 0, 100);
      const sop = clamp(num(parsed.sopCompliance, 0), 0, 100);
      const total = clamp(
        num(parsed.total, Math.round(attitude * 0.3 + logic * 0.35 + sop * 0.35)),
        0,
        100,
      );
      return {
        attitude,
        logic,
        sopCompliance: sop,
        total,
        strengths: arr(parsed.strengths),
        improvements: arr(parsed.improvements),
        recommendedTopics: arr(parsed.recommendedTopics),
        summary: String(parsed.summary ?? '').trim() || 'AI chưa có nhận xét.',
      };
    } catch {
      return this.stubGrade({ questionContent: '', studentAnswer: raw });
    }
  }

  private stubChat(messages: ChatMessage[]): string {
    const userMessages = messages.filter((m) => m.role === 'user');
    const turn = userMessages.length;
    const last = userMessages[userMessages.length - 1]?.content.toLowerCase() ?? '';
    const sys = messages.find((m) => m.role === 'system')?.content.toLowerCase() ?? '';

    const isPrice = sys.includes('chê giá') || sys.includes('giá cao') || sys.includes('đắt');
    const isCompetitor = sys.includes('đối thủ') || sys.includes('phần mềm khác');
    const isHesitant = sys.includes('lưỡng lự') || sys.includes('do dự') || sys.includes('trì hoãn');
    const hasSopKeywords =
      /(giá trị|roi|demo|case study|tiết kiệm|cam kết|lắng nghe|hiểu|số liệu|hiệu quả)/i.test(last);

    if (isPrice) {
      if (turn <= 1) {
        return 'Bên kia chỉ 200 nghìn/tháng thôi. Sao MKT lại đắt gấp đôi vậy?';
      }
      if (turn === 2) {
        return hasSopKeywords
          ? 'Hmm, anh nói cũng có lý. Nhưng tôi vẫn cần thấy minh chứng cụ thể.'
          : 'Vâng vâng, ai cũng nói chất lượng. Nhưng tôi chỉ thấy con số trên báo giá thôi.';
      }
      if (turn === 3) {
        return hasSopKeywords
          ? 'OK, tôi sẵn sàng xem demo. Nhưng nếu trong 1 tháng không thấy ROI, tôi sẽ chuyển bên kia.'
          : 'Tôi vẫn thấy lan man. Có gì cụ thể chứng minh tăng doanh số không?';
      }
      return 'Để tôi suy nghĩ thêm và phản hồi sau. Tạm dừng ở đây nhé.';
    }

    if (isCompetitor) {
      if (turn <= 1) {
        return 'Tôi đang dùng phần mềm X 6 tháng rồi, quen rồi. Sao tôi phải đổi sang MKT?';
      }
      if (turn === 2) {
        return hasSopKeywords
          ? 'Anh nói thì có vẻ ổn. Nhưng tôi sợ migration data sẽ rất mất công.'
          : 'Bên đó cũng làm được mấy cái anh nói thôi. Khác biệt cụ thể là gì?';
      }
      if (turn === 3) {
        return hasSopKeywords
          ? 'Được rồi, anh book demo 30 phút tuần sau cho tôi xem nhé.'
          : 'Vẫn chưa đủ thuyết phục với tôi.';
      }
      return 'Tôi sẽ cân nhắc và phản hồi anh tuần sau.';
    }

    if (isHesitant) {
      if (turn <= 1) return 'Tôi thấy hay đấy, nhưng để tôi nghĩ thêm vài hôm đã.';
      if (turn === 2) {
        return hasSopKeywords
          ? 'OK, vậy tôi quyết trong tuần này. Anh giữ lịch onboarding giúp tôi.'
          : '"Suy nghĩ thêm" nghĩa là vài tuần đó anh ạ. Không vội.';
      }
      return 'Cảm ơn anh, hẹn gặp lại.';
    }

    return 'Hmm... anh nói tiếp đi, tôi đang nghe.';
  }

  private stubGrade(input: GradeInput): AiGradingResult {
    const text = (input.studentAnswer ?? '').toLowerCase();
    const kws = (input.keywords ?? []).map((k) => k.toLowerCase());
    const matched = kws.filter((k) => text.includes(k));
    const sopRatio = kws.length > 0 ? matched.length / kws.length : 0.5;
    const lengthScore = Math.min(text.length / 200, 1);
    const attitude = Math.round(60 + lengthScore * 30);
    const logic = Math.round(50 + sopRatio * 40);
    const sop = Math.round(40 + sopRatio * 50);
    const total = Math.round(attitude * 0.3 + logic * 0.35 + sop * 0.35);

    return {
      attitude,
      logic,
      sopCompliance: sop,
      total,
      strengths:
        matched.length > 0
          ? [
              `Đã đề cập ${matched.length}/${kws.length} từ khóa cốt lõi: ${matched.slice(0, 3).join(', ')}`,
              `Câu trả lời có độ dài hợp lý (${text.length} ký tự)`,
            ]
          : ['Đã đầu tư viết câu trả lời', 'Có thái độ phản hồi'],
      improvements:
        sopRatio < 0.6
          ? [
              `Thiếu các điểm SOP quan trọng: ${kws.filter((k) => !matched.includes(k)).slice(0, 3).join(', ')}`,
              'Cần áp dụng rõ công thức LAARC khi xử lý phản đối',
            ]
          : ['Có thể đưa thêm ví dụ cụ thể như case study hoặc số ROI'],
      recommendedTopics: ['M4 - Xử lý từ chối', 'M3 - Kỹ năng chốt sale'],
      summary: `(Chấm STUB - chưa có API key hợp lệ hoặc AI provider đang lỗi) Tổng điểm ${total}/100. ${
        total >= 70
          ? 'Trả lời tốt, đáp ứng được yêu cầu.'
          : 'Cần ôn lại SOP và áp dụng LAARC chặt hơn.'
      }`,
    };
  }
}

const GRADING_SYSTEM_PROMPT = `Bạn là chuyên gia đào tạo Sales tại Phần mềm MKT (phanmemmkt.vn).
Nhiệm vụ: chấm điểm câu trả lời tình huống của nhân viên Sales theo 3 tiêu chí chuẩn nội bộ MKT.
Phong cách: khắt khe nhưng công bằng, đưa nhận xét xây dựng bằng TIẾNG VIỆT có dấu.
Luôn trả về JSON đúng schema yêu cầu, không kèm văn bản ngoài JSON.`;

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

function num(x: unknown, fallback: number): number {
  const n = typeof x === 'number' ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function arr(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x.map((v) => String(v)).filter((s) => s.trim().length > 0);
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function aiProviderException(provider: 'openai' | 'gemini', err: unknown): HttpException {
  const message = err instanceof Error ? err.message : String(err);
  const isAuthError =
    /\b401\b|incorrect api key|invalid api key|api_key_invalid|permission denied/i.test(message);
  const isQuotaError = /\b429\b|quota|rate limit|insufficient_quota/i.test(message);

  if (isAuthError) {
    return new HttpException(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message:
          provider === 'openai'
            ? 'OpenAI API key không hợp lệ. Vui lòng cập nhật key mới trong Admin > Kịch bản AI Coach.'
            : 'Gemini API key không hợp lệ. Vui lòng cập nhật key mới trong Admin > Kịch bản AI Coach.',
      },
      HttpStatus.BAD_GATEWAY,
    );
  }

  if (isQuotaError) {
    return new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message:
          provider === 'openai'
            ? 'OpenAI đang hết quota hoặc bị giới hạn tốc độ. Vui lòng kiểm tra billing/quota.'
            : 'Gemini đang hết quota hoặc bị giới hạn tốc độ. Vui lòng kiểm tra billing/quota.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  return new HttpException(
    {
      statusCode: HttpStatus.BAD_GATEWAY,
      message:
        provider === 'openai'
          ? 'OpenAI đang lỗi kết nối. Vui lòng thử lại hoặc kiểm tra cấu hình.'
          : 'Gemini đang lỗi kết nối. Vui lòng thử lại hoặc kiểm tra cấu hình.',
    },
    HttpStatus.BAD_GATEWAY,
  );
}
