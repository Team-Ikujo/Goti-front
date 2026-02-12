import { authHandlers } from "./auth";
import { termsHandlers } from "./terms";

export const handlers = [
  ...authHandlers,
  ...termsHandlers,
];
