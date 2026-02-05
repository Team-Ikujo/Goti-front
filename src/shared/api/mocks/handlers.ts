import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/api/v1/auth/:provider/login", async ({ params, request }) => {
    const { provider } = params;
    const body = (await request.json()) as { code?: string };

    if (!body?.code) {
      return HttpResponse.json(
        { message: "Missing authorization code." },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      isLinked: true,
      tempToken: `temp-${provider}-token`,
      accessToken: `access-${provider}-token`,
    });
  }),
];
