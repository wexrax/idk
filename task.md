# SubHub Admin Console — Task Breakdown

## Контекст

Текущий проект SubHub Admin Console реализован как contract-first UI с mock-сервисом и частичной live API интеграцией.

- Статус документации: `docs/STATUS.md` показывает `82/100` прогресса.
- Текущий backend scope: `G:\Repository\submart_backend\app\api\v1`.
- Live API контракт и реализация находятся в `src/lib/api/endpoints.ts`, `src/lib/api/live-service.ts`, `src/lib/api/http-client.ts`, `src/lib/api/client.ts`, `src/lib/api/contracts.ts`.
- `docs/ADMIN_API_REQUIREMENTS.md` описывает полный набор нужных endpoint'ов.

## Session update - 2026-06-04

- Текущий frontend API слой продолжает двигаться к full live integration через `src/lib/api/contracts.ts`, `endpoints.ts`, `client.ts`, `live-service.ts` и `mock-service.ts`.
- Уже подключены и отражены в документации: marketing segments/templates/promo bulk/referral config/edit actions, analytics reports/exports/scheduled reports, jobs list/detail/cancel, notifications list/status, security policies GET/PATCH.
- В этом проходе добавлен gamification API slice: achievements create/update/delete, rewards create/update/delete, review moderation/reply в contract/client/live/mock слоях.
- UI gamification теперь отправляет сохранение achievement, списание reward и ответ на review через backend-facing API client.
- UI gamification теперь также даёт edit/delete для achievements и create/delete для rewards через backend-facing API client.
- UI gamification теперь фильтрует отзывы по статусу/тональности и меняет moderation status через `PATCH /api/v1/reviews/{review_id}`.
- Следующий приоритет: dashboard/auth runtime parity с реальным FastAPI, SSE anomalies/jobs realtime, loyalty tiers/points ledger, расширенный поиск отзывов, full edit forms для marketing.

## Session update - 2026-06-05

- Текущее состояние: `docs/STATUS.md` показывает `82/100`, backend FastAPI `70%`, SSE realtime `35%`.
- Frontend API слой уже централизован через `src/lib/api/endpoints.ts`, `http-client.ts`, `client.ts`, `live-service.ts` и `mock-service.ts`; новые действия нужно продолжать подключать через этот слой.
- Самые сильные подключённые зоны: users CRM, subscriptions, dashboard fallback/error handling, marketing core actions, analytics exports/jobs, notifications, security policies и gamification CRUD/moderation.
- Основной незакрытый риск: runtime parity с запущенным FastAPI, потому что live UI ещё нужно проверить на реальные `401/404/503`, payload shapes и стабильность auth/profile.
- Realtime ещё частичный: notifications stream подключён на frontend, anomalies/jobs realtime требуют backend-подтверждения, invalidation и UI-проверки.
- Следующий приоритет: runtime FastAPI validation, SSE jobs/anomalies, loyalty tiers CRUD, points ledger/manual grant-revoke, расширенный поиск отзывов и full edit forms для marketing.

## Session update - 2026-06-05 API continuation

- Добавлен frontend API slice для gamification loyalty: `/loyalty/summary`, `/loyalty/ledger`, `/loyalty/points/adjust`, `/loyalty/tiers`, `/loyalty/tiers/{tier_id}`.
- `GamificationClient` теперь отправляет ручное начисление loyalty points через `adjustGamificationPoints`, а не создаёт ledger event только локально.
- `live-service` читает loyalty summary/tiers/ledger с fallback на `/rewards/history`, если новый backend endpoint ещё не готов.
- `mock-service` поддерживает create/update loyalty tiers и manual grant/revoke с обновлением `loyalty_events` и `loyalty_summary`.
- Следующий приоритет: runtime проверить эти loyalty endpoints на FastAPI, добавить delete tier при необходимости, затем продолжить SSE jobs/anomalies и расширенный поиск reviews.

## Цель

Подробно описать текущие задачи по доводке backend и frontend API-перекрытию, чтобы окончательно закрыть MVP и подготовиться к фазе production deployment.

## Общая задача

Сформировать рабочий план для реализации недостающих backend API и синхронизации его с текущими frontend-запросами, включая:

- создание и расширение endpoint'ов
- приведение форматов ответа к единой контрактной схеме
- завершение realtime/stream-слоя
- улучшение DevOps и готовность к prod

## Приоритеты

1. Backend и API parity для всех ключевых модулей
2. Realtime / SSE / jobs status / notifications
3. Billing + mobile API + gamification full CRUD
4. Production deploy, CI/CD, мониторинг

---

## Модули и задачи

### 1. Auth и профиль администратора

**Цель:** обеспечить полный auth flow и стабильный `GET /api/v1/auth/me`.

Задачи:
- [ ] Проверить и заново реализовать `GET /api/v1/auth/me` для выдачи профиля, ролей, permissions, MFA, avatar.
- [ ] Проверить совместимость `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`.
- [ ] Убедиться, что frontend fallback на JWT и переход на `GET /api/v1/admin-users/{id}` используется только как временное решение.
- [ ] Наладить единый error контракт для `401/403`.

Приемка:
- `GET /api/v1/auth/me` возвращает обязательные поля: `id`, `email`, `name`, `role`, `permissions`, `avatar_url`, `mfa_enabled`.
- Любой защищённый endpoint без токена возвращает корректную ошибку.

### 2. Dashboard и метрики

**Цель:** завершить аналитику и realtime anomalies.

Задачи:
- [ ] Завершить `GET /api/v1/dashboard/kpis`, `mrr-chart`, `new-users`, `risk-summary`, `anomalies`, `top-services`.
- [ ] Проверить `GET /api/v1/stream/anomalies` и довести до рабочего SSE-канала.
- [ ] Уточнить поля `updated_at`, `currency`, `expected_loss`, `romi_pct`.

Приемка:
- UI dashboard получает данные без fallback-режима.
- Realtime anomalies обновляются через stream.

### 3. Users CRM

**Цель:** полный CRM workflow для users и user profile.

Задачи:
- [ ] Проверить list query filters: `search`, `status`, `tariff_id`, `risk`, `registered_from`, `registered_to`, `page`, `per_page`, `sort_by`, `sort_dir`.
- [ ] Расширить экспорт `GET /api/v1/users/export` до форматов `csv`, `xlsx`, `pdf`.
- [ ] Убедиться, что `GET /api/v1/users/{user_id}` возвращает полный профиль и пользовательские subscriptions, transactions, achievements, activity.
- [ ] Довести `PATCH /api/v1/users/{user_id}` до рабочей обработки профиля/статуса.
- [ ] Проверить рабочие actions: block/unblock, grant-points, deduct-points, notes, bulk-action.

Приемка:
- CRM list и профиль загружаются без кейсов fallback на mock.
- Экспорт возвращает корректный `job_id` и статус.

### 4. Subscriptions и Tariffs

**Цель:** завершить оплатную модель, promo и тарифы.

Задачи:
- [ ] Убедиться, что `GET /api/v1/subscriptions` и `GET /api/v1/subscriptions/{subscription_id}` корректно возвращают subscription-поля.
- [ ] Проверить `PATCH /api/v1/subscriptions/{subscription_id}` для всех action: `renew`, `cancel`, `freeze`, `change_tariff`.
- [ ] Проверить `POST /api/v1/subscriptions/{subscription_id}/apply-promo` с payload `{ code }`.
- [ ] Завершить тарифный CRUD: `GET /api/v1/tariffs`, `POST /api/v1/tariffs`, `PATCH /api/v1/tariffs/{tariff_id}`, `POST /api/v1/tariffs/{tariff_id}/archive`, `POST /api/v1/tariffs/{tariff_id}/duplicate`, `GET /api/v1/tariffs/{tariff_id}/subscribers`.

Приемка:
- Admin может обновлять подписки и применять промокод.
- Тарифы создаются, архивируются и дублируются.

### 5. Marketing

**Цель:** полная маркетинговая админка: campaigns, promo, segments, templates, referrals, automations.

Задачи:
- [ ] Завершить campaigns CRUD: `GET /api/v1/campaigns`, `POST /api/v1/campaigns`, `PATCH /api/v1/campaigns/{campaign_id}`, `DELETE /api/v1/campaigns/{campaign_id}`, `POST /api/v1/campaigns/{campaign_id}/send`, `POST /api/v1/campaigns/{campaign_id}/cancel`.
- [ ] Завершить promo codes: `GET /api/v1/promo-codes`, `POST /api/v1/promo-codes`, `PATCH /api/v1/promo-codes/{promo_id}`, `DELETE /api/v1/promo-codes/{promo_id}`, `POST /api/v1/promo-codes/bulk`.
- [ ] Довести segments: `GET /api/v1/segments`, `POST /api/v1/segments`, `PATCH /api/v1/segments/{segment_id}`, `POST /api/v1/segments/{segment_id}/refresh`.
- [ ] Довести templates: `GET /api/v1/templates`, `POST /api/v1/templates`, `PATCH /api/v1/templates/{template_id}`, `DELETE /api/v1/templates/{template_id}`.
- [ ] Завершить referrals config: `GET /api/v1/referrals/config`, `PATCH /api/v1/referrals/config`.
- [ ] Автоматизации retention: `GET /api/v1/automations`, `POST /api/v1/automations/{automation_id}/run`.

Приемка:
- Маркетинг работает через live API без mock-only обходов.
- Сегменты и шаблоны сохраняются и обновляются.

### 6. Analytics

**Цель:** завершить аналитический модуль, exports и jobs.

Задачи:
- [ ] Завершить `GET /api/v1/analytics/reports`, `GET /api/v1/analytics/exports`, `POST /api/v1/analytics/exports`, `GET /api/v1/analytics/scheduled-reports`, `POST /api/v1/analytics/scheduled-reports`.
- [ ] Завершить custom dashboards storage и widget preview.
- [ ] Убедиться, что jobs используются для long-running export/task status.
- [ ] Поддержать `GET /api/v1/jobs`, `GET /api/v1/jobs/{job_id}`, `DELETE /api/v1/jobs/{job_id}`.

Приемка:
- Экспорт запускается, возвращает `job_id`, статус, а админ может отменить задачу.

### 7. Smart Analytics

**Цель:** работать с прогнозами, risk segments и automation preview.

Задачи:
- [ ] `GET /api/v1/automations`, `POST /api/v1/automations/{automation_id}/run`.
- [ ] Проверить модели risk segments и what-if сценариев.

Приемка:
- Smart analytics показывает обновлённые сегменты и позволяет запускать preview.

### 8. Security и RBAC

**Цель:** полная security workspace, audit и политики.

Задачи:
- [ ] Завершить `GET /api/v1/admin-users`, `GET /api/v1/sessions`, `DELETE /api/v1/sessions/{jti}`.
- [ ] Довести `GET /api/v1/audit-log`, `GET /api/v1/security/policies`.
- [ ] PATCH для MFA, rate limits, security headers: `PATCH /api/v1/security/policies`.
- [ ] Проверить `GET /api/v1/auth/me` на permissions + roles.

Приемка:
- Security page работает через live API.
- Админ может менять policy settings.

### 9. Settings

**Цель:** settings workspace с alert rules, integrations и drafts.

Задачи:
- [ ] `GET /api/v1/settings`, `PATCH /api/v1/settings`.
- [ ] Проверить локальную модель с alert rules, config drafts, integrations.

Приемка:
- Настройки обновляются и сохраняются.

### 10. Notifications и Real-time

**Цель:** довести realtime и уведомления до рабочего состояния.

Задачи:
- [ ] `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{notification_id}`.
- [ ] `GET /api/v1/stream/notifications` как SSE-поток; frontend уже содержит SSE reader в `src/components/admin/admin-shell.tsx`.
- [ ] Проверить, что backend stream endpoint поддерживает authenticated EventSource/fetch body stream.
- [ ] Реализовать обработку live event invalidation для UI.

Приемка:
- Уведомления приходят в реальном времени, пометка прочитанных работает.

### 11. Billing / Finance

**Цель:** подготовить базовый биллинг и финансовый reporting.

Задачи:
- [ ] Обозначить endpoint-ы для `GET /api/v1/billing/report`, `GET /api/v1/billing/report/export`, `GET /api/v1/payment-gateways`, `PATCH /api/v1/payment-gateways/{gateway_id}`, `POST /api/v1/payment-gateways/{gateway_id}/test`.
- [ ] Проверить export job формат и job_id.

Приемка:
- Таблица транзакций, gateways и отчет доступны, экспорт запускается через job.

### 12. DevOps и Production Deploy

**Цель:** подготовить инфраструктуру для стабильной поставки.

Задачи:
- [ ] Docker + Docker Compose для локальной dev и backend.
- [ ] CI/CD: GitHub Actions или аналог.
- [ ] Staging environment.
- [ ] Monitoring: Prometheus/Grafana или аналог.
- [ ] Backup для БД.

Приемка:
- Есть запуск проекта локально, тесты и smoke проходят в pipeline.

---

## Рекомендованный план работ

### Phase 2 — Backend parity и live API

- Завершить все missing endpoint'ы из `docs/ADMIN_API_REQUIREMENTS.md`.
- Привести `src/lib/api/live-service.ts` и `src/lib/api/contracts.ts` к единому backend контракту.
- Проверить fallback-режимы и убрать их там, где live API уже стабилен.

### Phase 3 — Realtime и jobs

- Реализовать `GET /api/v1/stream/anomalies`, `GET /api/v1/stream/notifications`.
- Убедиться, что backend SSE-поток работает с клиентским reader из `src/components/admin/admin-shell.tsx`.
- Убедиться, что jobs корректно работают для exports и long-running actions.

### Phase 4 — Production readiness

- Настроить CI/CD, мониторинг, staging, production.
- Провести интеграционные smoke и regression проверки.

---

## Техническая заметка

Все запросы должны возвращать JSON с единым error envelope:

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

Все даты — ISO 8601 UTC. Все деньги — `amount` + `currency`.

---

## Session update - 2026-06-05 live API continuation

- Добавлен frontend API slice для удаления loyalty tiers: `DELETE /api/v1/loyalty/tiers/{tier_id}` в `client.ts`, `live-service.ts` и `mock-service.ts`.
- `GamificationClient` теперь показывает действие удаления уровня лояльности и обновляет локальный список только после успешного backend-facing ответа.
- Удалён недостижимый локальный fallback ручного начисления баллов, чтобы live UI не имитировал успешное изменение данных при ошибке backend.
- `http-client.ts` теперь приводит сетевую недоступность live backend к единому `ApiError` (`NETWORK_ERROR`, `503`) и не смешивает это с `AbortError`.
- Проверка `http://127.0.0.1:8000/openapi.json` не прошла, потому что FastAPI backend сейчас не принимает соединение.
- Без запуска тестов выполнены проверки ошибок: `npm.cmd run typecheck`, `npm.cmd run lint`.
- Следующий приоритет: поднять FastAPI backend, проверить реальные OpenAPI/runtime shapes для loyalty summary/ledger/tiers/points adjust/delete tier, затем закрыть SSE anomalies/jobs и расширенный поиск отзывов.

## Session update - 2026-06-05 runtime API continuation

- `http://127.0.0.1:8000/openapi.json` теперь доступен и возвращает `200`.
- OpenAPI подтверждает dashboard, sessions, jobs, reviews и SSE stream endpoints.
- OpenAPI не содержит `/api/v1/loyalty/summary`, `/api/v1/loyalty/ledger`, `/api/v1/loyalty/points/adjust`, `/api/v1/loyalty/tiers`; эти frontend endpoints подключены, но backend runtime parity ещё не закрыт.
- Dashboard header больше не использует статичное `обновлено 2 мин. назад`: UI показывает время из `DashboardKpis.updated_at`, а mock обновляет `updated_at` при запросе.
- Security sessions теперь показывают локальное readable время вместо сырых ISO строк и схлопывают дубли backend sessions по `status + admin + ip + device`.
- `live-service` теперь поддерживает backend envelopes с payload в `data` и сохраняет pagination metadata для users/jobs/notifications.
- Создан `docs/BACKEND_API_IMPLEMENTATION_TODO.md`: backend чеклист endpoints и бизнес-логики для P0/P1/P2, включая отсутствующие loyalty endpoints и acceptance criteria.
- Следующий приоритет: authenticated runtime validation с валидным токеном, backend loyalty endpoints и SSE jobs/anomalies invalidation.

---

## Результат

Этот `task.md` служит планом задач по доводке backend/API и подготовке SubHub Admin Console к релизу, опираясь на текущее состояние `docs/STATUS.md` и `docs/ADMIN_API_REQUIREMENTS.md`.
