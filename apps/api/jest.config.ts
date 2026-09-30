import { nestConfig } from '@repo/jest-config';

export default {
  ...nestConfig,
  // @nestjs/passport(v12+)가 ESM-only로 배포돼 기본 transformIgnorePatterns로는
  // JwtAuthGuard를 import하는 테스트가 파싱 에러를 낸다. 이 패키지만 transform 대상에 포함.
  transformIgnorePatterns: ['node_modules/(?!.*@nestjs(/|\\+)passport)'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: { allowJs: true } }],
  },
};
