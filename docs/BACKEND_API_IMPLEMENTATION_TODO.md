# Backend API Implementation TODO

Дата: 2026-06-05

Источник требований:

- Frontend API layer: `src/lib/api/contracts.ts`, `src/lib/api/endpoints.ts`, `src/lib/api/live-service.ts`
- Требования админки: `docs/ADMIN_API_REQUIREMENTS.md`
- Live OpenAPI: `http://127.0.0.1:8000/openapi.json`

Цель: закрыть backend runtime parity для SubHub Admin Console, чтобы UI работал на реальных данных без mock-only обходов.

## Общий контракт

Все admin endpoints должны быть под `/api/v1`.

Все защищённые endpoints, кроме login/2FA/refresh, принимают:

```http
Authorization: Bearer <access_token>
```

Ошибки возвращаются единым envelope:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "UNAUTHORIZED",
    "details": null
  },
  "request_id": "uuid"
}
```

Списки возвращают pagination metadata:

```json
{
  "items": [],
  "page": 1,
  "per_page": 25,
  "total": 0,
  "total_pages": 0
}
```

Допустим также envelope с `data`, но внутри `data` должны сохраняться `items/page/per_page/total/total_pages`.

Все даты: ISO 8601 UTC. Все деньги: `amount` + `currency` или согласованная RUB-конвенция.

## P0 - отсутствующие backend endpoints

### Loyalty / Gamification Points

Эти endpoints уже подключены во frontend, но отсутствуют в текущем OpenAPI.

#### `GET /api/v1/loyalty/summary`

Назначение: сводка баллов лояльности для вкладки геймификации.

Ответ:

```json
{
  "points_balance": 1250000,
  "points_earned_month": 42000,
  "points_spent_month": 18000,
  "average_points_per_user": 320,
  "active_members": 3900
}
```

Бизнес-логика:

- `points_balance` = текущий суммарный баланс активных пользователей.
- `points_earned_month` = начисления за текущий календарный месяц.
- `points_spent_month` = списания/погашения за текущий календарный месяц.
- `average_points_per_user` считается по активным участникам loyalty.
- Исключать заблокированных/удалённых пользователей, если они не участвуют в loyalty.

#### `GET /api/v1/loyalty/ledger`

Назначение: журнал операций с баллами.

Query:

- `page`, `per_page`
- `user_id` или `user`
- `event_type`: `earned | redeemed | adjusted`
- `date_from`, `date_to`

Ответ item:

```json
{
  "id": "loyalty-event-001",
  "user": "Анна Морозова",
  "user_id": "user_001",
  "event_type": "earned",
  "amount": 100,
  "reason": "Компенсация поддержки",
  "source": "Admin",
  "date": "2026-06-05T14:30:00.000Z"
}
```

Бизнес-логика:

- Ledger append-only: операции не редактируются и не удаляются.
- `amount` положительный для начисления, отрицательный для списания/adjust revoke.
- Каждая manual операция должна писать audit-log event.
- Для списания нельзя увести баланс пользователя ниже 0, если бизнес-правило не разрешает overdraft.

#### `POST /api/v1/loyalty/points/adjust`

Назначение: ручное начисление/аннулирование баллов администратором.

Request:

```json
{
  "action": "grant",
  "user": "Анна Морозова",
  "user_id": "user_001",
  "amount": 100,
  "comment": "Компенсация за обращение в поддержку"
}
```

Response:

```json
{
  "event": {
    "id": "loyalty-event-123",
    "user": "Анна Морозова",
    "event_type": "earned",
    "amount": 100,
    "reason": "Компенсация за обращение в поддержку",
    "source": "Admin",
    "date": "2026-06-05T14:30:00.000Z"
  },
  "loyalty_summary": {
    "points_balance": 1250100,
    "points_earned_month": 42100,
    "points_spent_month": 18000,
    "average_points_per_user": 321,
    "active_members": 3900
  }
}
```

Бизнес-логика:

- `action`: `grant | revoke`.
- `amount` строго положительное целое число.
- `comment` обязателен, минимум 10 символов.
- Нужна permission check, например `gamification:write` или `loyalty:adjust`.
- Backend должен резолвить пользователя по `user_id`; `user` можно использовать только как display fallback.
- Транзакционно: обновить баланс, создать ledger event, создать audit-log event.

#### `GET /api/v1/loyalty/tiers`

Назначение: список уровней лояльности.

Ответ item:

```json
{
  "id": "tier-001",
  "name": "Silver",
  "threshold": 1000,
  "benefit": "5% cashback",
  "members": 320,
  "status": "active"
}
```

Бизнес-логика:

- Сортировка по `threshold` ascending.
- `members` считается по текущим пользователям, чей баланс/уровень соответствует tier.
- `status`: `active | inactive`.

#### `POST /api/v1/loyalty/tiers`

Request:

```json
{
  "name": "Gold",
  "threshold": 5000,
  "benefit": "Priority support",
  "status": "active"
}
```

Бизнес-логика:

- `threshold` уникален или не конфликтует с существующим tier range.
- Нельзя создать tier с пустым `name`/`benefit`.
- После создания пересчитать membership asynchronously или вернуть `members: 0` до фонового пересчёта.

#### `PATCH /api/v1/loyalty/tiers/{tier_id}`

Бизнес-логика:

- Разрешены изменения `name`, `threshold`, `benefit`, `status`.
- При изменении `threshold` нужно пересчитать affected members.
- Создать audit-log event.

#### `DELETE /api/v1/loyalty/tiers/{tier_id}`

Назначение: удаление/архивация уровня лояльности из UI.

Бизнес-логика:

- Предпочтительно soft delete или `status: inactive`, если tier уже использовался в истории.
- Нельзя удалить последний active tier, если продукт требует минимум один уровень.
- Создать audit-log event.

## P1 - endpoints есть, но нужна runtime/business parity

### Dashboard

Endpoints:

- `GET /api/v1/dashboard/kpis`
- `GET /api/v1/dashboard/mrr-chart`
- `GET /api/v1/dashboard/new-users`
- `GET /api/v1/dashboard/risk-summary`
- `GET /api/v1/dashboard/anomalies`
- `GET /api/v1/dashboard/top-services`

Нужно обеспечить:

- `dashboard/kpis` возвращает `updated_at`.
- `mrr.value`, `mrr.arr`, `mrr.currency`, `ltv_cac_ratio.romi_pct`, `churn_rate.delta_pp`.
- `risk-summary.expected_loss` и `currency`.
- Все timestamps в ISO UTC.

Бизнес-логика:

- KPI считаются по единому периоду, желательно `period=30d` или backend default.
- `updated_at` = реальное время расчёта или refresh materialized view.
- Если данные считаются фоном, возвращать последнюю успешную snapshot-версию.

### Sessions / Security

Endpoints:

- `GET /api/v1/sessions`
- `DELETE /api/v1/sessions/{jti}`

Нужно обеспечить:

- Не возвращать десятки дублей одной и той же активной browser session.
- Возвращать `jti`, `admin_email`/`user_email`, `ip`, `location`, `user_agent`/`device`, `created_at`, `updated_at` или `last_seen`, `revoked`, `expired`.

Бизнес-логика:

- Одна активная refresh/session запись на device fingerprint, если это соответствует auth model.
- Refresh token rotation должен либо инвалидировать старый `jti`, либо помечать его revoked/expired.
- `DELETE /sessions/{jti}` завершает только выбранную сессию и пишет audit-log.
- Current session нельзя завершить без явного подтверждения или нужно вернуть понятную ошибку.

### Jobs / long-running actions

Endpoints:

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/{job_id}`
- `DELETE /api/v1/jobs/{job_id}`

Нужно обеспечить:

```json
{
  "job_id": "job_001",
  "type": "analytics_export",
  "status": "queued",
  "progress_pct": 0,
  "requested_by": "admin@subhub.app",
  "input_data": {},
  "result": {},
  "error": null,
  "created_at": "2026-06-05T14:30:00.000Z",
  "started_at": null,
  "finished_at": null
}
```

Бизнес-логика:

- Export/report/bulk actions должны возвращать `job_id`.
- Cancel разрешён только для `queued | running`.
- Завершённые jobs не удаляются физически, а остаются в истории.
- `result.download_url` нужен для export jobs.

### SSE / realtime

Endpoints:

- `GET /api/v1/stream/notifications`
- `GET /api/v1/stream/anomalies`

Нужно обеспечить:

- Authenticated stream через Bearer token.
- Event format:

```text
event: notification
data: {"id":"notif_1","type":"billing_failure"}
```

```text
event: anomaly
data: {"id":"anom_1","severity":"warning"}
```

Бизнес-логика:

- Heartbeat/ping каждые 15-30 секунд.
- Завершать stream при invalid token/session revoke.
- Notifications events должны инвалидировать notifications/dashboard на frontend.
- Anomaly events должны инвалидировать dashboard/anomalies.

### Reviews moderation

Endpoints:

- `GET /api/v1/reviews`
- `PATCH /api/v1/reviews/{review_id}`
- `POST /api/v1/reviews/{review_id}/reply`

Нужно расширить:

- Query filters: `search`, `status`, `sentiment`, `rating`, `date_from`, `date_to`, `page`, `per_page`.
- Response fields: `id`, `user`, `rating`, `sentiment`, `status`, `message`, `tags`, `response`, `created_at`.

Бизнес-логика:

- `PATCH` меняет moderation status: `new | progress | resolved`.
- `reply` сохраняет response, author/admin id, timestamp.
- Status/reply changes пишут audit-log.

## P2 - расширения для полной админки

### Marketing edit forms

Endpoints уже есть:

- Campaigns CRUD/send/cancel
- Promo codes CRUD/bulk
- Segments create/update/refresh
- Templates CRUD
- Referrals config

Нужно проверить бизнес-логику:

- Campaign send создаёт job и не отправляет draft без валидного segment/template/body.
- Promo code uniqueness, expiry, max uses, status.
- Segment refresh пересчитывает audience asynchronously и возвращает job или обновлённый segment.
- Template delete лучше делать archive/soft delete.

### Analytics exports and scheduled reports

Endpoints:

- `GET /api/v1/analytics/reports`
- `GET /api/v1/analytics/exports`
- `POST /api/v1/analytics/exports`
- `GET /api/v1/analytics/scheduled-reports`
- `POST /api/v1/analytics/scheduled-reports`

Нужно обеспечить:

- Export formats: `csv`, `xlsx`, `pdf`.
- Export creation returns `job_id`.
- Completed export has `download_url`.
- Scheduled reports validate `frequency: daily | weekly | monthly` and recipients.

### Billing / Finance

Endpoints:

- `GET /api/v1/billing/report`
- `GET /api/v1/billing/report/export`
- `GET /api/v1/payment-gateways`
- `PATCH /api/v1/payment-gateways/{gateway_id}`
- `POST /api/v1/payment-gateways/{gateway_id}/test`
- `GET /api/v1/transactions`
- `POST /api/v1/transactions/{transaction_id}/refund`

Нужно обеспечить:

- Refund permission check and idempotency.
- Gateway test не логирует секреты.
- Billing export returns job/download.
- Money fields are consistent.

## Acceptance checklist

- OpenAPI содержит все endpoints из P0.
- `GET /api/v1/loyalty/*` проходит authenticated runtime smoke.
- `POST /api/v1/loyalty/points/adjust` транзакционно меняет баланс, ledger и audit-log.
- Dashboard `updated_at` приходит из backend, не генерируется frontend fallback при live success.
- Sessions list не создаёт дублей после refresh/login loop.
- Jobs используются для exports/bulk/long-running actions.
- SSE streams держат соединение, шлют heartbeat и backend events.
- Все protected endpoints без токена возвращают `401` в едином error envelope.
- Все list endpoints сохраняют `page/per_page/total/total_pages`.
