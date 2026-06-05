// Các kiểu dữ liệu cho Dashboard / Leaderboard / Badge / Mission / Certificate.
// Khớp với DTO trả từ backend.

export interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    department: { id: string; name: string } | null;
  };
  profile: {
    level: { id: string; order: number; name: string; expThreshold: number } | null;
    nextLevel: { order: number; name: string; expThreshold: number } | null;
    exp: number;
    expIntoLevel: number;
    expToNextLevel: number | null;
    streakCount: number;
    stage: string;
    rank: number | null;
  };
  kpi: {
    quizPassRate: number;
    quizAttempts: number;
    coursesCompleted: number;
    lessonsCompleted: number;
    weeklyExp: number;
  };
  recentMilestones: Milestone[];
  badges: BadgeWithStatus[];
  dailyMissions: MissionWithProgress[];
  enrolledCourses: EnrolledCourse[];
}

export interface Milestone {
  type: string;
  title: string;
  description: string;
  occurredAt: string;
}

export interface BadgeWithStatus {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface MissionWithProgress {
  missionId: string;
  title: string;
  description: string | null;
  rewardExp: number;
  ruleType: string;
  current: number;
  required: number;
  completed: boolean;
  completedAt: string | null;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
}

// ---- Leaderboard ----
export type LeaderboardType =
  | 'TOP_LEARNING'
  | 'TOP_SALES'
  | 'TOP_DILIGENT'
  | 'TOP_SUPPORT'
  | 'WEEKLY_WARRIOR';

export type LeaderboardPeriod = 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  department: string | null;
  level: number;
  levelName: string | null;
  score: number;
  metric: string;
  isMe?: boolean;
}

export interface LeaderboardResult {
  boardType: LeaderboardType;
  period: LeaderboardPeriod;
  rows: LeaderboardRow[];
  myRank: LeaderboardRow | null;
}

// ---- Certificate ----
export interface CertificateView {
  id: string;
  type: 'LEVEL' | 'COURSE';
  code: string;
  issuedAt: string;
  title: string;
  subtitle: string;
  recipientName: string;
  refId: string;
}
