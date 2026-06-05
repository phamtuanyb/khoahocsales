import { api } from './api-client';
import type {
  BadgeWithStatus,
  CertificateView,
  DashboardData,
  LeaderboardPeriod,
  LeaderboardResult,
  LeaderboardType,
  MissionWithProgress,
} from './gamification-types';

export const gamificationApi = {
  // Dashboard cá nhân
  getDashboard: () => api.get<DashboardData>('/profile/dashboard'),

  // Leaderboard
  getLeaderboard: (
    boardType: LeaderboardType,
    period: LeaderboardPeriod,
    limit = 50,
  ) =>
    api.get<LeaderboardResult>(
      `/leaderboard?boardType=${boardType}&period=${period}&limit=${limit}`,
    ),

  // Badge
  listBadges: () => api.get<BadgeWithStatus[]>('/badges'),

  // Mission
  todayMissions: () => api.get<MissionWithProgress[]>('/missions/today'),
  refreshMissions: () => api.post<MissionWithProgress[]>('/missions/refresh'),

  // Certificate
  listCertificates: () => api.get<CertificateView[]>('/certificates'),
  getCertificate: (id: string) => api.get<CertificateView>(`/certificates/${id}`),
};
