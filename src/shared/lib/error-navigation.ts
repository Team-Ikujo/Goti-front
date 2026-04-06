const SUPPORTED_ERROR_STATUSES = new Set([302, 404, 503]);

const isErrorRoute = (pathname: string) => /^\/error\/(302|404|503)$/.test(pathname);

export const redirectToErrorPage = (status: number) => {
   if (typeof window === 'undefined' || !SUPPORTED_ERROR_STATUSES.has(status)) {
      return;
   }

   if (isErrorRoute(window.location.pathname)) {
      return;
   }

   const nextUrl = new URL(`/error/${status}`, window.location.origin);
   const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;

   if (currentPath !== '/') {
      nextUrl.searchParams.set('from', currentPath);
   }

   window.location.assign(nextUrl.toString());
};
