let oauthPopup: Window | null = null;

export const openOAuthPopup = (url: string) => {
  const width = 480;
  const height = 640;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  if (oauthPopup && !oauthPopup.closed) {
    oauthPopup.location.href = url;
    oauthPopup.focus();
    return;
  }

  oauthPopup = window.open(
    url,
    "oauth-login",
    `width=${width},height=${height},left=${left},top=${top}`,
  );

  if (!oauthPopup) {
    window.location.assign(url);
  }
};
