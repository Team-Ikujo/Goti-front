const decodeBase64Url = (value: string) => {
   const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
   const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
   const latin1 = atob(padded);

   return decodeURIComponent(
      latin1
         .split('')
         .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`)
         .join(''),
   );
};

export const decodeJwtPayload = (accessToken: string | null): Record<string, unknown> | null => {
   if (!accessToken) {
      return null;
   }

   const tokenParts = accessToken.split('.');

   if (tokenParts.length < 2 || !tokenParts[1]) {
      return null;
   }

   try {
      return JSON.parse(decodeBase64Url(tokenParts[1])) as Record<string, unknown>;
   } catch {
      return null;
   }
};

export const resolveUserIdFromJwt = (accessToken: string | null) => {
   const payload = decodeJwtPayload(accessToken);

   if (!payload) {
      return null;
   }

   const userId =
      payload.userId ??
      payload.user_id ??
      payload.memberId ??
      payload.member_id ??
      payload.sub;

   return typeof userId === 'string' && userId.length > 0 ? userId : null;
};
