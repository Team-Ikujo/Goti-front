import { http, HttpResponse } from "msw";

export const authHandlers = [
  http.get("/api/v1/auth/:provider/state", async ({ params }) => {
    const { provider } = params;
    const state = `${provider}-state-token`;

    return HttpResponse.json({
      code: "SUCCESS",
      message: "ok",
      data: { state },
    });
  }),
  http.post("/api/v1/auth/:provider/social/verify", async ({ params, request }) => {
    const provider = params.provider;
    const body = (await request.json()) as {
      authCode?: string;
      state?: string;
    };

    const requiresState = provider === "NAVER" || provider === "GOOGLE";

    if (!body?.authCode || (requiresState && !body?.state)) {
      return HttpResponse.json(
        { message: "Missing social verify fields." },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      code: "SUCCESS",
      message: "ok",
      data: {
        isRegistered: false,
        socialVerifyToken: `svt-${body.authCode}`,
      },
    });
  }),
  http.post("/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { socialVerifyToken?: string };

    if (!body?.socialVerifyToken) {
      return HttpResponse.json(
        { message: "Missing social verify token." },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      code: "SUCCESS",
      message: "ok",
      data: {
        accessToken: "access-token-from-login",
      },
    });
  }),
  http.post("/api/v1/auth/signup", async ({ request }) => {
    const body = (await request.json()) as {
      socialVerifyToken?: string;
      name?: string;
      gender?: string;
      mobile?: string;
      birthDate?: string;
      authCode?: string;
    };

    if (
      !body?.socialVerifyToken ||
      !body?.name ||
      !body?.gender ||
      !body?.mobile ||
      !body?.birthDate ||
      !body?.authCode
    ) {
      return HttpResponse.json(
        { message: "Missing signup fields." },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      code: "SUCCESS",
      message: "ok",
      data: {
        accessToken: "access-token-from-signup",
      },
    });
  }),
  http.post("/api/v1/auth/signup/sms/send", async ({ request }) => {
    const body = (await request.json()) as {
      socialVerifyToken?: string;
      mobile?: string;
    };

    if (!body?.socialVerifyToken || !body?.mobile) {
      return HttpResponse.json(
        { message: "Missing sms send fields." },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      code: "SUCCESS",
      message: "ok",
      data: "SMS sent",
    });
  }),
];
