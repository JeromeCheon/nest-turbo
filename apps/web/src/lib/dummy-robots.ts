// ponytail: 백엔드 없는 더미 단계용 하드코딩 목록. 실연동 Task에서 삭제된다.
import type { RobotDto } from '@repo/api';

export const DUMMY_ROBOTS: RobotDto[] = [
  {
    id: 'r-1',
    name: 'Atlas-01',
    model: 'RX-100',
    status: 'active',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'r-2',
    name: 'Atlas-02',
    model: 'RX-100',
    status: 'idle',
    createdAt: '2026-01-11T09:00:00.000Z',
  },
  {
    id: 'r-3',
    name: 'Orion-01',
    model: 'RX-200',
    status: 'error',
    createdAt: '2026-01-12T09:00:00.000Z',
  },
  {
    id: 'r-4',
    name: 'Orion-02',
    model: 'RX-200',
    status: 'offline',
    createdAt: '2026-01-13T09:00:00.000Z',
  },
  {
    id: 'r-5',
    name: 'Nova-01',
    model: 'RX-300',
    status: 'active',
    createdAt: '2026-01-14T09:00:00.000Z',
  },
  {
    id: 'r-6',
    name: 'Nova-02',
    model: 'RX-300',
    status: 'idle',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
];
