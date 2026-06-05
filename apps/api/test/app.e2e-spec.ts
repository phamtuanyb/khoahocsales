// E2E tests cho 5 luồng nghiệp vụ quan trọng (spec mục 10).
// Chạy: npm run test:e2e --workspace=@mkt-academy/api
//
// LƯU Ý: tests dùng database dev (đã seed). Mỗi test tạo tài khoản với email
// unique (timestamp) để không xung đột giữa các lần chạy.

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

const SEED_PASSWORD = 'Mkt@12345';
const LEARNER_EMAIL = 'learner.sales@mkt.local';
const ADMIN_EMAIL = 'admin@mkt.local';

describe('MKT Academy — E2E (5 luồng chính)', () => {
  let app: INestApplication;
  let server: ReturnType<INestApplication['getHttpServer']>;
  let prisma: PrismaService;

  // ---- bootstrap app 1 lần cho mọi suite ----
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  // ---- helpers ----
  async function login(email: string, password: string): Promise<string> {
    const res = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password });
    if (res.status !== 200) {
      throw new Error(`Login lỗi (${res.status}): ${JSON.stringify(res.body)}`);
    }
    return res.body.accessToken as string;
  }

  function uniqueEmail(prefix: string): string {
    return `e2e.${prefix}.${Date.now()}.${Math.floor(Math.random() * 9999)}@mkt.test`;
  }

  // ===================================================
  // LUỒNG 1 — ĐĂNG NHẬP
  // ===================================================
  describe('Luồng 1 — Đăng nhập + phân quyền', () => {
    it('login đúng tài khoản seed → trả access + refresh token', async () => {
      const res = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: LEARNER_EMAIL, password: SEED_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(LEARNER_EMAIL);
      expect(res.body.user.role).toBe('LEARNER');
    });

    it('login sai mật khẩu → 401', async () => {
      const res = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: LEARNER_EMAIL, password: 'wrong-password' });
      expect(res.status).toBe(401);
    });

    it('GET /auth/me không token → 401', async () => {
      const res = await request(server).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('GET /auth/me có token → trả profile + needsCharacterSetup', async () => {
      const token = await login(LEARNER_EMAIL, SEED_PASSWORD);
      const res = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(LEARNER_EMAIL);
      expect(typeof res.body.needsCharacterSetup).toBe('boolean');
    });

    it('refresh token đổi cặp token mới', async () => {
      const login1 = await request(server)
        .post('/api/v1/auth/login')
        .send({ email: LEARNER_EMAIL, password: SEED_PASSWORD });
      const oldRefresh = login1.body.refreshToken;

      const refreshRes = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefresh });
      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.refreshToken).toBeDefined();
    });
  });

  // ===================================================
  // LUỒNG 2 — LÀM QUIZ (sanitize đáp án + chấm điểm)
  // ===================================================
  describe('Luồng 2 — Làm quiz', () => {
    let token: string;
    beforeAll(async () => {
      token = await login(LEARNER_EMAIL, SEED_PASSWORD);
    });

    it('GET /quizzes/quiz-m1 — câu hỏi đã sanitize (không lộ answer)', async () => {
      const res = await request(server)
        .get('/api/v1/quizzes/quiz-m1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions.length).toBeGreaterThan(0);
      // QUAN TRỌNG: không một câu nào được lộ trường `answer`
      for (const q of res.body.questions) {
        expect(q).not.toHaveProperty('answer');
      }
    });

    it('POST /quizzes/quiz-m1/submit — đáp án đúng 100% → score=100, expAwarded>0', async () => {
      const submitRes = await request(server)
        .post('/api/v1/quizzes/quiz-m1/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          answers: {
            'q-m1-mc-1': { type: 'MULTIPLE_CHOICE', selected: 'B' },
            'q-m1-mc-2': { type: 'MULTIPLE_CHOICE', selected: 'C' },
            'q-m1-mc-3': { type: 'MULTIPLE_CHOICE', selected: 'A' },
            'q-m1-mc-4': { type: 'MULTIPLE_CHOICE', selected: 'B' },
            'q-m1-drag-1': {
              type: 'MINI_GAME',
              order: ['step-lead', 'step-contact', 'step-discover', 'step-demo', 'step-close'],
            },
          },
        });
      expect(submitRes.status).toBe(200);
      expect(submitRes.body.score).toBe(100);
      expect(submitRes.body.passed).toBe(true);
      expect(submitRes.body.expAwarded).toBeGreaterThan(0);
      expect(submitRes.body.correctCount).toBe(5);
    });

    it('submit với đáp án sai → score thấp, passed=false', async () => {
      const res = await request(server)
        .post('/api/v1/quizzes/quiz-m1/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          answers: {
            'q-m1-mc-1': { type: 'MULTIPLE_CHOICE', selected: 'A' }, // sai
            'q-m1-mc-2': { type: 'MULTIPLE_CHOICE', selected: 'A' }, // sai
            'q-m1-mc-3': { type: 'MULTIPLE_CHOICE', selected: 'D' }, // sai
            'q-m1-mc-4': { type: 'MULTIPLE_CHOICE', selected: 'A' }, // sai
            'q-m1-drag-1': { type: 'MINI_GAME', order: ['step-close', 'step-lead'] }, // sai
          },
        });
      expect(res.status).toBe(200);
      expect(res.body.score).toBeLessThan(70);
      expect(res.body.passed).toBe(false);
    });
  });

  // ===================================================
  // LUỒNG 3 — LÊN LEVEL (cấp EXP qua admin → kiểm tra Level Up)
  // ===================================================
  describe('Luồng 3 — Lên Level qua EXP threshold', () => {
    let testUserId: string;
    let testToken: string;
    let adminToken: string;
    const email = uniqueEmail('levelup');

    beforeAll(async () => {
      adminToken = await login(ADMIN_EMAIL, SEED_PASSWORD);

      // Tạo user mới qua API admin
      const createRes = await request(server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          name: 'E2E LevelUp User',
          password: 'Test@12345',
          role: 'LEARNER',
        });
      expect(createRes.status).toBe(201);
      testUserId = createRes.body.id;
      testToken = await login(email, 'Test@12345');
    });

    afterAll(async () => {
      // Cleanup
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch {
        /* ignore */
      }
    });

    it('user mới có Level 1, EXP = 0', async () => {
      const res = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.profile.exp).toBe(0);
      expect(res.body.profile.level.order).toBe(1);
    });

    it('admin cộng đủ EXP → user tự nhảy lên Level 2', async () => {
      const adjustRes = await request(server)
        .post(`/api/v1/admin/users/${testUserId}/adjust-exp`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 400, reason: 'E2E test cộng EXP' });
      expect(adjustRes.status).toBe(201);

      const meRes = await request(server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${testToken}`);
      expect(meRes.body.profile.exp).toBeGreaterThanOrEqual(400);
      expect(meRes.body.profile.level.order).toBeGreaterThanOrEqual(2);
      expect(meRes.body.profile.level.name).toBe('Thực Chiến');
    });
  });

  // ===================================================
  // LUỒNG 4 — KHÓA/MỞ KHÓA
  // ===================================================
  describe('Luồng 4 — Cơ chế khóa/mở khóa', () => {
    let testUserId: string;
    let testToken: string;
    let adminToken: string;
    const email = uniqueEmail('lock');

    beforeAll(async () => {
      adminToken = await login(ADMIN_EMAIL, SEED_PASSWORD);
      // Cần phòng Sales để khóa Sales mở được
      const dept = await prisma.department.findFirst({ where: { name: 'Sales' } });
      const createRes = await request(server)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          name: 'E2E Lock User',
          password: 'Test@12345',
          role: 'LEARNER',
          departmentId: dept?.id,
        });
      testUserId = createRes.body.id;
      testToken = await login(email, 'Test@12345');
    });

    afterAll(async () => {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch {
        /* ignore */
      }
    });

    it('M1 mở (mô-đun đầu) — học được lesson-m1-1', async () => {
      const res = await request(server)
        .get('/api/v1/lessons/lesson-m1-1')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(200);
      expect(res.body.title).toBeDefined();
    });

    it('M2 khóa khi M1 chưa hoàn thành → 403', async () => {
      const res = await request(server)
        .get('/api/v1/lessons/lesson-m2-1')
        .set('Authorization', `Bearer ${testToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/khóa/i);
    });

    it('admin force unlock module M2 → user vào học M2 được', async () => {
      const unlockRes = await request(server)
        .post(`/api/v1/admin/users/${testUserId}/force-unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          targetType: 'MODULE',
          targetId: 'mod-sales-m1', // unlock = hoàn thành M1 → mở M2
          reason: 'E2E test mở khóa đặc cách',
        });
      expect(unlockRes.status).toBe(201);

      const lessonRes = await request(server)
        .get('/api/v1/lessons/lesson-m2-1')
        .set('Authorization', `Bearer ${testToken}`);
      expect(lessonRes.status).toBe(200);
    });
  });

  // ===================================================
  // LUỒNG 5 — ADMIN TẠO CÂU HỎI + PHÂN QUYỀN
  // ===================================================
  describe('Luồng 5 — Admin tự nhập câu hỏi', () => {
    let adminToken: string;
    let createdQuestionId: string;

    beforeAll(async () => {
      adminToken = await login(ADMIN_EMAIL, SEED_PASSWORD);
    });

    afterAll(async () => {
      if (createdQuestionId) {
        try {
          await prisma.question.delete({ where: { id: createdQuestionId } });
        } catch {
          /* ignore */
        }
      }
    });

    it('admin tạo câu MC với options + answer → 201', async () => {
      const res = await request(server)
        .post('/api/v1/admin/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'MULTIPLE_CHOICE',
          content: '[E2E] Đáp án nào đúng?',
          options: [
            { key: 'A', text: 'Đáp án A' },
            { key: 'B', text: 'Đáp án B đúng' },
            { key: 'C', text: 'Đáp án C' },
          ],
          answer: { correct: 'B' },
          difficulty: 'EASY',
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      createdQuestionId = res.body.id;
    });

    it('admin tạo MC với answer.correct không khớp options → 400', async () => {
      const res = await request(server)
        .post('/api/v1/admin/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'MULTIPLE_CHOICE',
          content: '[E2E] Lỗi validate',
          options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
          answer: { correct: 'Z' }, // không tồn tại
        });
      expect(res.status).toBe(400);
    });

    it('learner gọi admin endpoint → 403 (phân quyền)', async () => {
      const learnerToken = await login(LEARNER_EMAIL, SEED_PASSWORD);
      const res = await request(server)
        .post('/api/v1/admin/questions')
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({
          type: 'MULTIPLE_CHOICE',
          content: '[E2E] Test 403',
          options: [{ key: 'A', text: 'A' }, { key: 'B', text: 'B' }],
          answer: { correct: 'A' },
        });
      expect(res.status).toBe(403);
    });

    it('admin update + delete câu hỏi vừa tạo → ok', async () => {
      const update = await request(server)
        .patch(`/api/v1/admin/questions/${createdQuestionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: '[E2E] Updated content' });
      expect(update.status).toBe(200);
      expect(update.body.content).toContain('Updated');
    });
  });

  // ===================================================
  // Bonus: Health check public
  // ===================================================
  describe('Health check public', () => {
    it('GET /health không token → 200', async () => {
      const res = await request(server).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
