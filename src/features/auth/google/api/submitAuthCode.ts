export type SubmitAuthCodeParams = {
  code: string;
  state?: string;
};

export const submitAuthCode = async ({ code, state }: SubmitAuthCodeParams) => {
  return { code, state };
};
