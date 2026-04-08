import { authHandlers } from "./auth";
import { gameHandlers } from "./game";
import { paymentHandlers } from "./payment";
import { queueHandlers } from "./queue";

export const handlers = [
  ...authHandlers,
  ...gameHandlers,
  ...paymentHandlers,
  ...queueHandlers,
];
