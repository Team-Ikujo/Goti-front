# 홈구단 팀 코드 Path 전달

클라우드 팀 제안에 맞춰 예매 플로우 API는 홈구단 `teamCode` 를 path 로 전달한다.

## 규칙

```text
/api/{teamCode}/v1/...
```

예시:

```text
/api/KIA/v1/queue/enter
/api/LG/v1/stadium-seats/games/{gameId}/seat-grades
/api/SSG/v1/orders
```

## 사용 값

- `homeTeamId(UUID)` 사용 안 함
- `header` 사용 안 함
- `query` 사용 안 함
- `teamCode` 사용

| 구단명 | teamCode |
|---|---|
| 삼성 라이온즈 | `SS` |
| KIA 타이거즈 | `KIA` |
| LG 트윈스 | `LG` |
| 한화 이글스 | `HH` |
| SSG 랜더스 | `SSG` |
| NC 다이노스 | `NC` |
| KT wiz | `KT` |
| 롯데 자이언츠 | `LOT` |
| 두산 베어스 | `DO` |
| 키움 히어로즈 | `KIW` |

## 적용 대상 API

| 구분 | Method | API |
|---|---|---|
| 대기열 | `POST` | `/api/{teamCode}/v1/queue/enter` |
| 대기열 | `GET` | `/api/{teamCode}/v1/queue/{gameId}/global-status` |
| 대기열 | `GET` | `/api/{teamCode}/v1/queue/{gameId}/status` |
| 대기열 | `POST` | `/api/{teamCode}/v1/queue/{gameId}/seat-enter` |
| 대기열 | `POST` | `/api/{teamCode}/v1/queue/{gameId}/leave` |
| 좌석 예매 | `GET` | `/api/{teamCode}/v1/stadium-seats/games/{gameId}/seat-grades` |
| 좌석 예매 | `GET` | `/api/{teamCode}/v1/stadium-seats/stadiums/{stadiumId}/seat-sections` |
| 좌석 예매 | `GET` | `/api/{teamCode}/v1/seats/seat-sections/{sectionId}/seats` |
| 좌석 예매 | `GET` | `/api/{teamCode}/v1/game-seats/{gameId}/sections/{sectionId}/seat-statuses` |
| 좌석 예매 | `GET` | `/api/{teamCode}/v1/teams/{teamId}/ticket-pricing-policies` |
| 좌석 예매 | `POST` | `/api/{teamCode}/v1/seat-reservations/seats/{seatId}` |
| 좌석 예매 | `POST` | `/api/{teamCode}/v1/seat-reservations/{holdId}` |
| 결제 | `POST` | `/api/{teamCode}/v1/orders` |
| 결제 | `GET` | `/api/{teamCode}/v1/payments/orders/{orderId}` |
| 결제 | `POST` | `/api/{teamCode}/v1/payments/orders/{orderId}` |
| 리셀 결제 | `POST` | `/api/{teamCode}/v1/resales/holds` |
| 리셀 결제 | `PATCH` | `/api/{teamCode}/v1/resales/holds/{holdId}/release` |
| 리셀 결제 | `POST` | `/api/{teamCode}/v1/resales/orders` |
| 리셀 결제 | `GET` | `/api/{teamCode}/v1/resales/orders/{orderId}/transactions` |
| 리셀 결제 | `POST` | `/api/{teamCode}/v1/payments/resales` |
| 리셀 결제 | `PATCH` | `/api/{teamCode}/v1/resales/orders/{orderId}/complete` |
| 리셀 결제 | `GET` | `/api/{teamCode}/v1/payments/resales/ledgers/orders/{orderId}` |
