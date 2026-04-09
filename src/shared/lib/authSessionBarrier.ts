let resolveSessionBarrier: (() => void) | null = null;

const createSessionBarrier = () =>
  new Promise<void>((resolve) => {
    resolveSessionBarrier = resolve;
  });

let sessionBarrierPromise = createSessionBarrier();

export const waitForAuthSessionResolution = () => sessionBarrierPromise;

export const markAuthSessionResolved = () => {
  resolveSessionBarrier?.();
  resolveSessionBarrier = null;
};

export const resetAuthSessionBarrier = () => {
  if (resolveSessionBarrier !== null) {
    return;
  }

  sessionBarrierPromise = createSessionBarrier();
};
