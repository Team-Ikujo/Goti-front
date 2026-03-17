import { http, HttpResponse } from "msw";
import type { PaymentRequest } from "@/pages/tickets/api/paymentApi";

export const paymentHandlers = [
  http.post("/api/v1/tickets/payment", async ({ request }) => {
    const body = (await request.json()) as PaymentRequest;

    const now = new Date();
    const orderedAt = now.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return HttpResponse.json({
      code: "SUCCESS",
      message: "ok",
      data: {
        orderNumber: `ORD${Date.now()}`,
        gameTitle: "기아 vs LG",
        gameDate: "2026.03.21 (토) 18:30",
        gameVenue: "기아 챔피언스필드",
        quantity: 2,
        seats: ["1E-2구역 0열 0번", "1E-2구역 0열 1번"],
        paymentMethod:
          body.paymentMethod === "card"
            ? "신용/체크카드"
            : body.paymentMethod === "kakao"
              ? "카카오페이"
              : body.paymentMethod === "naver"
                ? "네이버페이"
                : body.paymentMethod === "toss"
                  ? "토스페이"
                  : "무통장 입금",
        orderedAt,
        amount: 5000,
        ...(body.deliveryMethod === "delivery" && {
          recipientName: body.ordererName,
          recipientPhone: body.ordererPhone,
          recipientAddress: `${body.address} ${body.addressDetail ?? ""}`.trim(),
        }),
      },
    });
  }),
];
