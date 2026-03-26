import { gameHandlers } from "./game";
import { paymentHandlers } from "./payment";

export const handlers = [
  ...gameHandlers,
  ...paymentHandlers,
];
