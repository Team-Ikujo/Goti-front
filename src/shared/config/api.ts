const DEFAULT_API_ORIGIN = 'https://dev.go-ti.shop';

export const configuredApiBaseUrl =
   (import.meta.env.PUBLIC_API_BASE_URL ?? '').trim() || DEFAULT_API_ORIGIN;

export const shouldUseRelativeApiBase = import.meta.env.DEV;
