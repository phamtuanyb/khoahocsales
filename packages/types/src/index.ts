// ==========================================
// Types & Interfaces dùng chung cho FE + BE
// ==========================================

// ---- Vai trò người dùng ----
export enum UserRole {
  LEARNER = 'LEARNER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

// ---- Trạng thái tài khoản ----
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

// ---- Giai đoạn HR Journey (mục 4.2) ----
export enum JourneyStage {
  ONBOARDING = 'ONBOARDING', // GĐ1 — 7 ngày đầu
  PRACTICE = 'PRACTICE', // GĐ2 — Tuần 2-6
  GROWTH = 'GROWTH', // GĐ3 — Tháng 2-3
  LEADER = 'LEADER', // GĐ4 — Sau tháng 3
}

// ---- Trạng thái bài học ----
export enum LessonStatus {
  LOCKED = 'LOCKED',
  AVAILABLE = 'AVAILABLE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

// ---- Loại câu hỏi (mục 5.4) ----
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // Trắc nghiệm
  SITUATION = 'SITUATION', // Tình huống thực tế (AI chấm)
  MINI_GAME = 'MINI_GAME', // Kéo-thả, nối cặp, chọn nhanh
  BOSS_BATTLE = 'BOSS_BATTLE', // Bài thi cuối Level
}

// ---- Độ khó câu hỏi ----
export enum QuestionDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

// ---- Hành động cộng EXP (mục 5.5) ----
export enum ExpAction {
  LESSON_COMPLETED = 'LESSON_COMPLETED', // +10
  QUIZ_CORRECT_ANSWER = 'QUIZ_CORRECT_ANSWER', // +20 / câu đúng
  COURSE_COMPLETED = 'COURSE_COMPLETED', // +100
  DAILY_LOGIN_STREAK = 'DAILY_LOGIN_STREAK', // +5
  TEAM_SUPPORT = 'TEAM_SUPPORT', // +15
  BOSS_BATTLE_PASSED = 'BOSS_BATTLE_PASSED', // +200
  AI_COACH_SESSION = 'AI_COACH_SESSION',
  MISSION_COMPLETED = 'MISSION_COMPLETED',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT', // Admin điều chỉnh thủ công
}

// ---- Loại leaderboard (mục 5.6) ----
export enum LeaderboardType {
  TOP_LEARNING = 'TOP_LEARNING', // Top Học Tập
  TOP_SALES = 'TOP_SALES', // Top Sales (KPI chốt đơn)
  TOP_DILIGENT = 'TOP_DILIGENT', // Top Chăm Chỉ (streak)
  TOP_SUPPORT = 'TOP_SUPPORT', // Top Support (giai đoạn sau)
  WEEKLY_WARRIOR = 'WEEKLY_WARRIOR', // Chiến Binh Tuần
}

// ---- Chu kỳ leaderboard ----
export enum LeaderboardPeriod {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

// ---- Trạng thái lượt thi ----
export enum QuizAttemptStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

// ---- Loại chứng chỉ ----
export enum CertificateType {
  LEVEL = 'LEVEL',
  COURSE = 'COURSE',
}

// ---- Loại reaction bình luận ----
export enum CommentReactionType {
  LIKE = 'LIKE',
  HELPFUL = 'HELPFUL',
  INSIGHTFUL = 'INSIGHTFUL',
}

// ---- DTO trả về cho Dashboard cá nhân (mục 5.2) ----
export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: UserRole;
  };
  profile: {
    level: number;
    levelName: string;
    exp: number;
    expToNextLevel: number;
    rank: number | null;
    streakCount: number;
    stage: JourneyStage;
  };
  kpi: {
    quizPassRate: number; // 0..1
    coursesCompleted: number;
    weeklyExp: number;
  };
  recentMilestones: Milestone[];
  badges: BadgeProgress[];
  dailyMissions: MissionProgress[];
  enrolledCourses: CourseProgress[];
}

export interface Milestone {
  type: 'LEVEL_UP' | 'BADGE_EARNED' | 'COURSE_COMPLETED' | 'WEEKLY_TOP';
  title: string;
  description: string;
  occurredAt: string; // ISO date
}

export interface BadgeProgress {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface MissionProgress {
  missionId: string;
  title: string;
  rewardExp: number;
  completed: boolean;
}

export interface CourseProgress {
  courseId: string;
  title: string;
  progressPercent: number; // 0..100
}

// ---- DTO cấu hình unlock_rule (lưu dạng JSON) ----
export interface UnlockRule {
  requireLevel?: number;
  requirePrevModule?: string; // module id
  requireMinExp?: number;
  requirePassedQuizIds?: string[];
}

// ---- Response chuẩn ----
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ---- Auth ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    departmentId: string | null;
  };
}

// ---- AI Coach ----
export interface AiCoachMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AiCoachScoreBreakdown {
  attitude: number; // Thái độ (30%)
  logic: number; // Logic xử lý (35%)
  sopCompliance: number; // Đúng SOP (35%)
  total: number; // 0..100
}

export interface AiCoachFeedback {
  score: AiCoachScoreBreakdown;
  strengths: string[];
  improvements: string[];
  recommendedLessonIds: string[];
}
