import { authHandlers } from "./auth";
import { paymentHandlers } from "./payment";
import { termsHandlers } from "./terms";

export const handlers = [
  ...authHandlers,
  ...termsHandlers,
  ...paymentHandlers,
];
