# Admin API Requirements

Источник backend scope: `G:\Repository\submart_backend\app\api\v1`.
Live OpenAPI при запущенном backend: `http://127.0.0.1:8000/docs`.
Frontend API contracts: `src/lib/api/contracts.ts`, `src/lib/api/endpoints.ts`, `src/lib/api/live-service.ts`.

Цель документа: описать все API, которые нужны backend для полной рабочей админки SubHub: авторизация, CRM, подписки, метрики, биллинг, маркетинг, умная аналитика, безопасность, настройки, jobs, exports и realtime.

Обновлено: 2026-06-03.

## Статусы

- `Есть` - endpoint есть в текущем backend.
- `Есть, подключено` - frontend уже использует endpoint.
- `Есть, нужно расширить` - endpoint есть, но для полного UI нужны дополнительные поля, фильтры или форматы.
- `Нужно добавить` - endpoint нужен полной админке, но его нет или он не покрывает сценарий.

## Общий контракт

Все admin endpoints должны быть под `/api/v1`.

Все admin requests, кроме login, 2FA и refresh, должны принимать:

```http
Authorization: Bearer <access_token>
```

Списки должны поддерживать:

- `page`;
- `per_page`;
- `total`;
- `total_pages`;
- `sort_by`;
- `sort_dir`;
- module-specific filters.

Минимальный list envelope:

```json
{
  "items": [],
  "page": 1,
  "per_page": 25,
  "total": 0,
  "total_pages": 0
}
```

Минимальный item envelope:

```json
{
  "item": {}
}
```

Ошибки:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  },
  "request_id": "req_..."
}
```

Long-running actions должны возвращать `job_id`, а статус должен читаться через `GET /api/v1/jobs/{job_id}`.

Exports должны поддерживать `csv`, `xlsx`, `pdf`, если формат есть в UI.

Даты: ISO 8601 UTC.

Деньги: `amount` + `currency`, либо единый backend convention для RUB.

## Auth и профиль администратора

| API | Для чего нужно в админке | Статус |
|---|---|---|
| `POST /api/v1/auth/login` | Вход email/password | Есть, подключено |
| `POST /api/v1/auth/2fa/verify` | Проверка 2FA | Есть, подключено |
| `POST /api/v1/auth/refresh` | Обновление access token | Есть, подключено |
| `POST /api/v1/auth/logout` | Logout и отзыв сессии | Есть, подключено |
| `GET /api/v1/auth/me` | Профиль, роль, permissions, MFA, avatar | Есть, подключено |
| `POST /api/v1/auth/2fa/setup` | Подключение 2FA | Есть |
| `POST /api/v1/auth/2fa/confirm` | Подтверждение 2FA | Есть |
| `DELETE /api/v1/auth/2fa` | Отключение 2FA | Есть |

Минимальный `GET /auth/me`:

```json
{
  "id": "admin_1",
  "email": "admin@subhub.app",
  "name": "Admin",
  "role": "super_admin",
  "permissions": ["dashboard:read", "users:read"],
  "avatar_url": null,
  "mfa_enabled": true
}
```

## Dashboard и метрики

| API | Данные | Статус |
|---|---|---|
| `GET /api/v1/dashboard/kpis` | Active users, MRR, ARR, churn, LTV:CAC, ROMI | Есть, подключено |
| `GET /api/v1/dashboard/mrr-chart` | MRR и новые пользователи по датам | Есть, подключено |
| `GET /api/v1/dashboard/new-users` | Новые пользователи, дневной/недельный виджет | Есть, подключено |
| `GET /api/v1/dashboard/risk-summary` | Риск оттока: high/medium/low, expected loss | Есть, подключено |
| `GET /api/v1/dashboard/anomalies` | Аномалии и alerts | Есть, подключено |
| `GET /api/v1/dashboard/top-services` | Топ сервисов по выручке/росту | Есть, подключено |
| `GET /api/v1/stream/anomalies` | Realtime anomalies SSE | Есть |

`dashboard/kpis` должен возвращать:

- `active_users.value`;
- `active_users.delta_pct`;
- `mrr.value`;
- `mrr.currency`;
- `mrr.arr`;
- `mrr.delta_pct`;
- `churn_rate.value`;
- `churn_rate.delta_pp`;
- `ltv_cac_ratio.value`;
- `ltv_cac_ratio.romi_pct`;
- `updated_at`.

## Users CRM

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/users` | CRM table, поиск, фильтры, пагинация | Есть, подключено |
| `GET /api/v1/users/export` | Export users | Есть, подключено, нужно расширить форматы |
| `GET /api/v1/users/{user_id}` | Карточка пользователя | Есть, подключено |
| `PATCH /api/v1/users/{user_id}` | Изменение профиля/статуса | Есть |
| `POST /api/v1/users/{user_id}/block` | Блокировка | Есть, подключено |
| `POST /api/v1/users/{user_id}/unblock` | Разблокировка | Есть, подключено |
| `POST /api/v1/users/{user_id}/grant-points` | Начисление баллов | Есть, подключено |
| `POST /api/v1/users/{user_id}/deduct-points` | Списание баллов | Есть, подключено |
| `POST /api/v1/users/{user_id}/notes` | Admin notes | Есть, подключено |
| `POST /api/v1/users/bulk-action` | Bulk block/unblock/status actions | Есть, подключено |
| `GET /api/v1/users/{user_id}/subscriptions` | Подписки пользователя | Есть |
| `GET /api/v1/users/{user_id}/transactions` | Транзакции пользователя | Есть |
| `GET /api/v1/users/{user_id}/achievements` | Достижения пользователя | Есть |
| `GET /api/v1/users/{user_id}/activity` | Activity timeline | Есть |

Фильтры `GET /users`:

- `search`;
- `status`;
- `tariff_id`;
- `risk` или `churn_risk`;
- `registered_from`;
- `registered_to`;
- `page`;
- `per_page`;
- `sort_by`;
- `sort_dir`.

Поля строки пользователя:

- `id`, `name`, `email`, `phone`;
- `status`;
- `registered_at`, `last_seen_at`;
- `tariff`, `tariff_id`;
- `mrr`, `currency`;
- `churn_risk`, `churn_probability`;
- `points_balance`;
- `country`, `city`, `region`;
- `devices`;
- `active_subscriptions`.

## Subscriptions и Tariffs

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/subscriptions` | Таблица подписок | Есть, подключено |
| `GET /api/v1/subscriptions/{subscription_id}` | Детали подписки | Есть |
| `PATCH /api/v1/subscriptions/{subscription_id}` | `renew`, `cancel`, `freeze`, `change_tariff` | Есть, подключено |
| `POST /api/v1/subscriptions/{subscription_id}/apply-promo` | Применить промокод админом | Есть, подключено |
| `GET /api/v1/tariffs` | Список тарифов | Есть, подключено |
| `POST /api/v1/tariffs` | Создать тариф | Есть, подключено |
| `GET /api/v1/tariffs/{tariff_id}` | Детали тарифа | Есть |
| `PATCH /api/v1/tariffs/{tariff_id}` | Изменить тариф | Есть, подключено |
| `POST /api/v1/tariffs/{tariff_id}/archive` | Архивировать тариф | Есть, подключено |
| `POST /api/v1/tariffs/{tariff_id}/duplicate` | Дублировать тариф | Есть, подключено |
| `GET /api/v1/tariffs/{tariff_id}/subscribers` | Подписчики тарифа | Есть |

Subscription mutation:

```json
{
  "action": "renew",
  "tariff_id": "tariff_1",
  "cancel_reason": null,
  "frozen_until": null
}
```

Apply promo:

```json
{
  "code": "WELCOME10"
}
```

Поля подписки:

- `id`;
- `user_id`, `user_name`, `user_email`;
- `service.id`, `service.name`;
- `tariff_id`, `tariff`;
- `status`;
- `started_at`, `expires_at`, `renewed_at`;
- `price`, `currency`;
- `payment_gateway`;
- `retry_count`;
- `promo_code`;
- `cancel_reason`, `frozen_until`.

Поля тарифа:

- `id`, `name`, `description`;
- `price`, `currency`;
- `billing_period`;
- `trial_days`;
- `is_public`;
- `status`;
- `services`;
- `subscribers`;
- feature flags/limits.

## Billing, payments, gateways

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/transactions` | Транзакции | Есть, подключено |
| `GET /api/v1/transactions/{transaction_id}` | Детали транзакции | Есть |
| `POST /api/v1/transactions/{transaction_id}/refund` | Refund | Есть |
| `GET /api/v1/billing/report` | MRR, ARR, NRR, churn revenue | Есть, подключено |
| `GET /api/v1/billing/report/export` | Export billing report | Есть, подключено, нужно расширить форматы/job |
| `GET /api/v1/payment-gateways` | Payment gateways | Есть, подключено |
| `PATCH /api/v1/payment-gateways/{gateway_id}` | Настройки gateway | Есть, подключено |
| `POST /api/v1/payment-gateways/{gateway_id}/test` | Test gateway | Есть, подключено |

Фильтры `GET /transactions`:

- `search`;
- `status`;
- `gateway`;
- `user_id`;
- `date_from`;
- `date_to`;
- `amount_from`;
- `amount_to`;
- `page`;
- `per_page`.

Поля транзакции:

- `id`, `user_id`, `user_name`, `user_email`;
- `amount`, `currency`;
- `status`;
- `gateway`;
- `external_id`;
- `subscription_id`;
- `created_at`;
- `refunded_at`;
- `failure_reason`.

## Marketing: campaigns, promos, segments, referrals, templates

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/campaigns` | Список кампаний | Есть, подключено |
| `POST /api/v1/campaigns` | Создать кампанию | Есть, подключено |
| `GET /api/v1/campaigns/{campaign_id}` | Детали кампании и stats | Есть |
| `PATCH /api/v1/campaigns/{campaign_id}` | Редактировать draft campaign | Есть, подключено |
| `POST /api/v1/campaigns/{campaign_id}/send` | Запуск рассылки | Есть, подключено |
| `POST /api/v1/campaigns/{campaign_id}/cancel` | Отмена | Есть, подключено |
| `DELETE /api/v1/campaigns/{campaign_id}` | Удалить кампанию | Есть, подключено |
| `GET /api/v1/promo-codes` | Промокоды | Есть, подключено |
| `POST /api/v1/promo-codes` | Создать промокод | Есть, подключено |
| `POST /api/v1/promo-codes/bulk` | Bulk generate промокоды | Есть, подключено |
| `GET /api/v1/promo-codes/{promo_id}` | Детали промокода и stats | Есть |
| `PATCH /api/v1/promo-codes/{promo_id}` | Редактировать промокод | Есть, подключено |
| `DELETE /api/v1/promo-codes/{promo_id}` | Деактивировать промокод | Есть, подключено |
| `GET /api/v1/segments` | Сегменты аудитории | Есть, подключено |
| `POST /api/v1/segments` | Создать сегмент | Есть, подключено |
| `GET /api/v1/segments/{segment_id}` | Детали сегмента | Есть |
| `PATCH /api/v1/segments/{segment_id}` | Обновить сегмент | Есть, подключено в API-слое |
| `POST /api/v1/segments/{segment_id}/refresh` | Пересчитать сегмент | Есть, подключено |
| `GET /api/v1/referrals/stats` | Referral summary | Есть |
| `GET /api/v1/referrals` | Referral events/users | Есть |
| `PATCH /api/v1/referrals/config` | Настройка referral rewards | Есть, подключено |
| `GET /api/v1/templates` | Message templates | Есть, подключено |
| `POST /api/v1/templates` | Создать template | Есть, подключено |
| `PATCH /api/v1/templates/{template_id}` | Обновить template | Есть, подключено |
| `DELETE /api/v1/templates/{template_id}` | Архивировать template | Есть, подключено |

Campaign body:

```json
{
  "name": "Renewal push",
  "channel": "push",
  "segment_id": "segment_1",
  "subject": "Optional email subject",
  "body": "Message body",
  "scheduled_at": "2026-06-03T12:00:00Z"
}
```

Segment body:

```json
{
  "name": "High churn risk",
  "filters": {
    "churn_risk": "high",
    "status": "active"
  }
}
```

Promo bulk body:

```json
{
  "prefix": "SUMMER",
  "count": 100,
  "discount_type": "percent",
  "discount_value": 15
}
```

Для полной админки marketing UI ещё нужно подключить frontend-кнопки/формы для:

- edit UI для `PATCH /segments/{id}`;
- расширенные формы редактирования campaign/promo/template вместо быстрых row actions.

## Analytics, ML, reports, exports

| API | Данные/операция | Статус |
|---|---|---|
| `POST /api/v1/analytics/what-if` | What-if сценарии | Есть |
| `GET /api/v1/analytics/churn-risk` | Churn cohorts/users | Есть |
| `GET /api/v1/analytics/churn-risk/{user_id}` | Churn risk пользователя | Есть |
| `GET /api/v1/analytics/ltv` | LTV cohorts | Есть |
| `GET /api/v1/analytics/ltv/{user_id}` | LTV пользователя | Есть |
| `GET /api/v1/analytics/ab-tests` | A/B tests | Есть |
| `POST /api/v1/analytics/ab-tests` | Создать A/B test | Есть |
| `PATCH /api/v1/analytics/ab-tests/{test_id}` | Изменить A/B test | Есть |
| `GET /api/v1/analytics/ab-tests/{test_id}/results` | Результаты A/B test | Есть |
| `POST /api/v1/analytics/ml/retrain` | Запуск ML retrain | Есть |
| `GET /api/v1/analytics/reports` | Reports library | Есть, подключено |
| `GET /api/v1/analytics/exports` | Export jobs/files | Есть, подключено |
| `POST /api/v1/analytics/exports` | Создать analytics export | Есть, подключено |
| `GET /api/v1/analytics/scheduled-reports` | Scheduled reports | Есть, подключено |
| `POST /api/v1/analytics/scheduled-reports` | Создать scheduled report | Есть, подключено |

Нужно для полного UI:

- фильтры `date_from`, `date_to`, `cohort`, `segment_id`;
- drilldown по метрикам;
- compare periods;
- report preview;
- download link для export jobs;
- schedule frequency: `daily`, `weekly`, `monthly`;
- recipients для scheduled reports.

## Smart analytics и automations

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/automations` | Список automations | Есть, подключено |
| `POST /api/v1/automations` | Создать automation | Есть |
| `GET /api/v1/automations/{automation_id}` | Детали automation | Есть |
| `PATCH /api/v1/automations/{automation_id}` | Изменить automation | Есть |
| `POST /api/v1/automations/{automation_id}/toggle` | Включить/поставить на паузу | Есть |
| `DELETE /api/v1/automations/{automation_id}` | Удалить automation | Есть |
| `POST /api/v1/automations/{automation_id}/run` | Запустить automation | Есть, подключено |
| `GET /api/v1/automations/{automation_id}/runs` | История запусков | Есть |
| `POST /api/v1/automations/{automation_id}/preview` | Preview matched users/actions | Есть |
| `POST /api/v1/automations/run-active` | Запустить активные rules | Есть |

Нужно для полного UI:

- action templates;
- preview sample users;
- run status;
- last error;
- matched count;
- conversion after automation.

## Gamification

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/gamification/summary` | Summary dashboard | Есть |
| `GET /api/v1/achievements` | Achievements | Есть, подключено |
| `POST /api/v1/achievements` | Создать achievement | Есть, подключено |
| `GET /api/v1/achievements/{achievement_id}` | Детали achievement | Есть |
| `PATCH /api/v1/achievements/{achievement_id}` | Изменить achievement | Есть, подключено |
| `DELETE /api/v1/achievements/{achievement_id}` | Удалить achievement | Есть, подключено |
| `GET /api/v1/rewards` | Rewards | Есть, подключено |
| `POST /api/v1/rewards` | Создать reward | Есть, подключено |
| `PATCH /api/v1/rewards/{reward_id}` | Изменить reward | Есть, подключено |
| `DELETE /api/v1/rewards/{reward_id}` | Удалить reward | Есть, подключено |
| `GET /api/v1/rewards/history` | Reward history | Есть, подключено |
| `GET /api/v1/loyalty/summary` | Loyalty points summary | Нужно добавить, frontend подключен |
| `GET /api/v1/loyalty/ledger` | Points ledger | Нужно добавить, frontend подключен |
| `POST /api/v1/loyalty/points/adjust` | Manual grant/revoke points | Нужно добавить, frontend подключен |
| `GET /api/v1/loyalty/tiers` | Loyalty tiers | Нужно добавить, frontend подключен |
| `POST /api/v1/loyalty/tiers` | Создать loyalty tier | Нужно добавить, frontend подключен |
| `PATCH /api/v1/loyalty/tiers/{tier_id}` | Изменить loyalty tier | Нужно добавить, frontend подключен |
| `GET /api/v1/reviews` | Reviews/moderation | Есть, подключено |
| `PATCH /api/v1/reviews/{review_id}` | Moderation status | Есть, подключено |
| `POST /api/v1/reviews/{review_id}/reply` | Ответ на review | Есть, подключено |

Нужно для полного UI:

- backend runtime parity для `/loyalty/summary`, `/loyalty/ledger`, `/loyalty/points/adjust` и `/loyalty/tiers`;
- delete endpoint для loyalty tiers, если UI должен поддерживать удаление уровней;
- расширенные detail forms для rewards и achievements;
- расширенные moderation queue filters/search.

## Security, admins, audit, settings

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/audit-log` | Audit events | Есть, подключено |
| `GET /api/v1/audit-log/export` | Export audit | Есть |
| `GET /api/v1/sessions` | Admin sessions | Есть, подключено |
| `DELETE /api/v1/sessions/{jti}` | Terminate session | Есть, подключено |
| `GET /api/v1/admin-users` | Admin users | Есть, подключено |
| `POST /api/v1/admin-users` | Создать админа | Есть |
| `GET /api/v1/admin-users/{admin_id}` | Детали админа | Есть, подключено как fallback profile |
| `PATCH /api/v1/admin-users/{admin_id}` | Изменить роль/status | Есть |
| `DELETE /api/v1/admin-users/{admin_id}` | Удалить/деактивировать | Есть |
| `GET /api/v1/settings` | System settings | Есть, подключено |
| `PATCH /api/v1/settings` | Изменить settings | Есть, подключено |
| `GET /api/v1/security/policies` | MFA, headers, rate limits, password policy | Есть, подключено |
| `PATCH /api/v1/security/policies` | Изменить policies | Есть, подключено |

Нужно для полного UI:

- permission matrix;
- roles CRUD или fixed roles с readable permissions;
- расширить MFA enforcement by role до полноценного role picker;
- IP allowlist/denylist;
- session risk score;
- расширить webhook/security headers policy до full edit forms;
- config drafts/publish history.

## Notifications, realtime, jobs

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/notifications` | Notification list | Есть, подключено |
| `PATCH /api/v1/notifications/{notification_id}` | `unread`, `read`, `archived` | Есть, подключено |
| `GET /api/v1/stream/notifications` | SSE notifications | Есть, подключено |
| `GET /api/v1/stream/anomalies` | SSE anomalies | Есть |
| `GET /api/v1/jobs` | Jobs history | Есть, подключено |
| `GET /api/v1/jobs/{job_id}` | Job status/details | Есть, подключено в API-слое |
| `DELETE /api/v1/jobs/{job_id}` | Cancel job | Есть, подключено |

Notification item:

```json
{
  "id": "notif_1",
  "type": "subscription_expiry",
  "status": "unread",
  "severity": "warning",
  "title": "Subscription expires soon",
  "description": "18 subscriptions expire in 3 days",
  "module": "subscriptions",
  "payload": {},
  "created_at": "2026-06-03T12:00:00Z",
  "read_at": null
}
```

SSE event:

```text
event: notification
data: {"id":"notif_1","type":"billing_failure"}
```

Job item:

- `job_id`;
- `type`;
- `status`: `queued`, `running`, `completed`, `failed`, `cancelled`;
- `progress_pct`;
- `requested_by`;
- `input_data`;
- `result`;
- `error`;
- `created_at`, `started_at`, `finished_at`.

## Health и observability

| API | Данные/операция | Статус |
|---|---|---|
| `GET /api/v1/health` | Health check | Есть |
| `GET /api/v1/metrics` | Service metrics | Есть |

Для полной админки желательно добавить:

- `GET /api/v1/system/status` - DB/Redis/queue/provider status;
- `GET /api/v1/system/events` - platform events;
- `GET /api/v1/system/integrations` - payment/email/push/webhook health.

## Mobile API, если админка управляет mobile product data

Эти endpoints нужны не для admin shell напрямую, но важны для end-to-end продукта:

| API | Данные/операция | Статус |
|---|---|---|
| `POST /api/v1/mobile/auth/register` | Регистрация mobile user | Есть |
| `POST /api/v1/mobile/auth/login` | Mobile login | Есть |
| `POST /api/v1/mobile/auth/refresh` | Refresh | Есть |
| `POST /api/v1/mobile/auth/logout` | Logout | Есть |
| `GET /api/v1/mobile/profile` | Профиль пользователя | Есть |
| `PATCH /api/v1/mobile/profile` | Изменить профиль | Есть |
| `GET /api/v1/mobile/subscriptions` | Подписки пользователя | Есть |
| `POST /api/v1/mobile/subscriptions/apply-promo` | Промокод пользователем | Есть |
| `GET /api/v1/mobile/catalog` | Каталог тарифов/сервисов | Есть |
| `GET /api/v1/mobile/services` | Сервисы | Есть |
| `GET /api/v1/mobile/points` | Баллы | Есть |
| `GET /api/v1/mobile/achievements` | Достижения | Есть |

## Что нужно доделать для полной рабочей админки

1. Добить edit UI для marketing segments и segment picker вместо текстового поля в campaign/message/automation forms.
2. Расширить edit UI для campaigns, promo codes, templates до полноценных форм с изменением всех полей.
3. Расширить jobs UI до полноценного detail drawer: input/result/error, timestamps, фильтры по статусу.
4. Расширить gamification UI: loyalty tiers CRUD, points ledger/manual grant-revoke и расширенный moderation search.
5. Расширить security policies UI: role picker для MFA, full edit для headers/rate limits, audit trail изменений.
6. Расширить exports на `csv`, `xlsx`, `pdf` там, где backend пока возвращает только один формат или job без download link.
7. Убедиться, что запущенный backend соответствует текущему коду: в браузере сейчас `GET /api/v1/notifications` может отдавать `404`, хотя endpoint есть в исходниках.
8. Добавить реальные totals/summary endpoints там, где UI сейчас считает показатели на клиенте по текущей странице.
9. Унифицировать поля денег и дат во всех ответах.
10. Зафиксировать RBAC permissions для каждого admin route и отразить их в `GET /auth/me`.
11. Добавить недостающие фильтры и поля в существующие endpoints для полного покрытия UI.
12. Провести end-to-end тестирование всех сценариев в админке и убедиться, что нет 404 или других ошибок из-за отсутствующих API.
