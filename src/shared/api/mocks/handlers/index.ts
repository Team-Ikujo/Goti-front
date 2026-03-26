import { authHandlers } from "./auth";
import { gameHandlers } from "./game";
import { paymentHandlers } from "./payment";

export const handlers = [
  ...authHandlers,
  ...gameHandlers,
  ...paymentHandlers,
];
