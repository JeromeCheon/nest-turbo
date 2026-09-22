import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RobotDto } from '@repo/api';

import { DUMMY_ROBOTS } from './dummy-robots';

interface RobotStore {
  viewMode: 'list' | 'card';
  setViewMode: (mode: 'list' | 'card') => void;
  robots: RobotDto[];
  addRobot: (robot: RobotDto) => void;
}

export const useRobotStore = create<RobotStore>()(
  persist(
    (set) => ({
      viewMode: 'card',
      setViewMode: (viewMode) => set({ viewMode }),
      robots: DUMMY_ROBOTS,
      addRobot: (robot) => set((s) => ({ robots: [robot, ...s.robots] })),
    }),
    {
      name: 'robot-dashboard-view',
      partialize: (s) => ({ viewMode: s.viewMode }),
    },
  ),
);
