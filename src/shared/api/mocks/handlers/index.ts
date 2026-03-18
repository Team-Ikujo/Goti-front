import { authHandlers } from "./auth";
import { paymentHandlers } from "./payment";

export const handlers = [
  ...authHandlers,
  ...paymentHandlers,
];
