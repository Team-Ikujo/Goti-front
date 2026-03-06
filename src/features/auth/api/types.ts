export type ApiEnvelope<T> = {
  code: string;
  message: string;
  data: T;
};
