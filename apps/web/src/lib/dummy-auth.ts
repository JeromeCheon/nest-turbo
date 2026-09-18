// ponytail: 백엔드 없는 상태의 데모용 매직 트리거 + 임시 세션 쿠키.
// 실연동 Task에서 실제 fetch 응답 처리로 교체되며 이 파일은 삭제된다.
export const DUMMY_DUPLICATE_EMAIL = 'taken@example.com';
export const DUMMY_WRONG_PASSWORD = 'wrongpass1';
export const DUMMY_NETWORK_ERROR_EMAIL = 'network-error@example.com';

export function setDummySessionCookie() {
  document.cookie =
    'access_token=dummy-session; path=/; max-age=3600; samesite=lax';
}
