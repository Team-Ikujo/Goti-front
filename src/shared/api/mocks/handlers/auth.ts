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
  http.post("/api/v1/auth/:provider/social/verify", async ({ request }) => {
    const body = (await request.json()) as {
      code?: string;
      redirectUri?: string;
    };

    if (!body?.code || !body?.redirectUri) {
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
        socialVerifyToken: `svt-${body.code}`,
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
    };

    if (
      !body?.socialVerifyToken ||
      !body?.name ||
      !body?.gender ||
      !body?.mobile ||
      !body?.birthDate
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
];
