export type SubmitAuthCodeParams = {
  code: string;
  state?: string;
};

export const submitAuthCode = async ({ code, state }: SubmitAuthCodeParams) => {
  //TODO: 백엔드 /api/v1/auth/oauth/{provider}/identify 경로로 OAuth 코드 검증 API 이용하여 전송
  // 최초 로그인 경우에 따라 회원가입 동작으로 이어지기 혹은 login으로 넘어가기

  return { code, state };
};
