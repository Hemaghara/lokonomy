import { vi } from 'vitest';

export const recommendationService = {
  trackInteraction: vi.fn().mockResolvedValue({ data: { success: true } }),
  getRecommendations: vi.fn().mockResolvedValue({ data: [] }),
  trackView: vi.fn().mockResolvedValue({ data: { success: true } }),
  getPersonalizedFeed: vi.fn().mockResolvedValue({ data: [] }),
};
