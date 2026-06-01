# SubHub Admin Console — Статус проекта

**Дата:** 5 июня 2026
**Версия:** 1.5 (MVP)  
**Статус:** 🟢 Функционально готов к разработке (contract-first UI + mocks)

---

## 📊 Сводка по статусу

| Категория | Статус | Прогресс |
|-----------|--------|----------|
| **Инфраструктура** | ✅ Готово | 100% |
| **UI/Компоненты** | ✅ Готово | 100% |
| **API контракты** | ✅ Готово | 100% |
| **Mock-сервис** | ✅ Готово | 100% |
| **Тестирование** | ✅ Готово | 100% |
| **Бэкенд (FastAPI)** | ⚠️ Частично реализован | 70% |
| **Продвинутая аналитика** | ✅ Готово | 100% |
| **RBAC/Аудит** | ✅ Готово | 100% |
| **SSE реальное время** | ⚠️ Частично (notifications + anomalies) | 35% |
| **Продакшн-развёртывание** | ❌ Не начато | 0% |

**Общий прогресс MVP:** `82/100` (82%)

---

## ✅ Завершено

### Инфраструктура и инструменты
- [x] Next.js 16 App Router + React 19 инициализация
- [x] TypeScript + ESLint конфигурация
- [x] Tailwind CSS v4 с кастомными темными токенами (`@theme` syntax)
- [x] HeroUI v3 интеграция (без Framer Motion в компонентах)
- [x] Vitest конфигурация + Testing Library
- [x] Настройка Playwright (smoke-тесты)
- [x] Zustand UI-store
- [x] TanStack Query provider с глобальной обработкой ошибок

### API и контракты
- [x] `src/lib/api/contracts.ts` — TypeScript DTOs, aligned с FastAPI
- [x] `src/lib/api/mock-data.ts` — детерминированные фиксчуры
- [x] `src/lib/api/mock-service.ts` — in-memory имплементация
- [x] `src/lib/api/client.ts` — адаптер (готов к переключению на real API)
- [x] Error handling shape + status codes

### Админская оболочка и layout
- [x] `src/app/(admin)/layout.tsx` — Route Group с AdminShell
- [x] `src/components/admin/admin-shell.tsx` — интерактивный shell:
  - [x] Боковая панель с навигацией
  - [x] Заголовок + логотип
  - [x] Фильтр по ролям (role filtering)
  - [x] Переключатель окружения (environment: prod/staging/dev)
  - [x] Глобальный поиск
  - [x] Система уведомлений (toast)
  - [x] Collapse боковой панели (desktop)
- [x] `src/components/admin/mobile-sidebar.tsx` — мобильный drawer
- [x] `src/components/admin/navigation.ts` — модель навигации + RBAC metadata

### Маршруты (9 модулей)
- [x] `/dashboard` — KPI, график MRR, аномалии, топ-сервисы
- [x] `/users` — CRM таблица, поиск, фильтры, пагинация
- [x] `/users/[id]` — профиль пользователя, блокировка, выдача поинтов
- [x] `/subscriptions` — тарифные планы, статусы подписок
- [x] `/marketing` — contract-first рабочая зона: кампании, A/B тесты, сегменты, промо-черновики, локальная валидация
- [x] `/gamification` — contract-first рабочая зона: достижения, магазин наград, отзывы приложения, валидация
- [x] `/analytics` — contract-first рабочая зона: отчеты, когорты, очередь экспорта CSV/PDF/Excel, расписанные отчеты, кастомные дашборды, валидация
- [x] `/smart-analytics` — contract-first рабочая зона: прогнозы, когорты, сценарные панели
- [x] `/security` — contract-first рабочая зона: роли RBAC, матрица разрешений, история аудита, управление сессиями, 2FA/MFA, лимитирование API, заголовки безопасности, события аудита, правила политики
- [x] `/settings` — contract-first рабочая зона: черновики конфигурации, интеграции, правила оповещений, валидация

### Компоненты UI
- [x] `src/components/dashboard/metric-card.tsx` — KPI карточка
- [x] `src/components/dashboard/mrr-chart.tsx` — Recharts график MRR
- [x] `src/components/users/users-client.tsx` — CRM таблица с фильтрацией
- [x] `src/components/users/user-profile.tsx` — карточка профиля
- [x] `src/components/subscriptions/subscriptions-client.tsx` — таблица тарифов
- [x] `src/components/ui/error-state.tsx` — ошибка layout
- [x] `src/components/ui/loading-state.tsx` — skeleton загрузка
- [x] `src/components/ui/section.tsx` — обертка секции
- [x] `src/components/ui/status-badge.tsx` — статус бейджи

### Тестирование
- [x] `src/tests/shell.test.tsx` (9473b) — полное покрытие shell:
  - [x] Навигация по ролям
  - [x] Переключение окружения
  - [x] Глобальный поиск
  - [x] Уведомления
  - [x] Сворачивание боковой панели
  - [x] Мобильное выдвижное меню
- [x] `src/tests/dashboard.test.tsx` — рендер dashboard
- [x] `src/tests/users.test.tsx` — CRM функционал
- [x] `src/tests/subscriptions.test.tsx` — подписки
- [x] `src/tests/analytics.test.tsx` — аналитика
- [x] `src/tests/smart-analytics.test.tsx` — умная аналитика
- [x] `src/tests/gamification.test.tsx` — геймификация
- [x] `src/tests/marketing.test.tsx` — маркетинг
- [x] `src/tests/security.test.tsx` — безопасность
- [x] `src/tests/settings.test.tsx` — настройки
- [x] `src/tests/contracts.test.ts` — валидация контрактов и моков
- [x] `src/tests/providers.test.tsx` — провайдеры
- [x] `src/tests/smoke.spec.ts` — проверочные smoke тесты Playwright (desktop + mobile)

### Документация
- [x] `SPEC_SubHub_Admin_Dashboard.md` — полная техническая спецификация
- [x] `AGENTS.md` — архитектурные заметки для AI-агентов
- [x] `README.md` — обзор проекта и инструкция по запуску
- [x] `docs/superpowers/plans/` — 32 реализованных плана фич, включая маркетинговые рефералы и промокоды

### 2026-05-24 Session Update
- [x] В Smart Analytics добавлен ML прогноз оттока в сегменты риска с вероятностью, доверием и ключевыми драйверами.
- [x] `SmartAnalyticsClient` теперь показывает понятный интерфейс what-if, прогноз оттока, детали риска и предпросмотр автоматизации.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/smart-analytics.test.tsx` и `npm.cmd run lint`.
- [x] Контрактные данные аналитики добавлены в `contracts.ts`, `mock-data.ts`, `mock-service.ts` и `client.ts`.
- [x] `AnalyticsClient` теперь загружает данные через React Query и обрабатывает состояния загрузки, пустоты и ошибки.
- [x] Конструктор отчетов аналитики валидирует кастомные сегменты перед локальным обновлением UI.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/analytics.test.tsx` и `npm.cmd run lint`.
- [x] Контрактные данные геймификации добавлены в `contracts.ts`, `mock-data.ts`, `mock-service.ts` и `client.ts`.
- [x] `GamificationClient` теперь загружает данные через React Query и обрабатывает состояния загрузки, пустоты и ошибки.
- [x] Формы геймификации валидируют поля достижений и ответы на отзывы перед локальным обновлением UI.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/gamification.test.tsx` и `npm.cmd run lint`.
- [x] Контрактные данные настроек добавлены в `contracts.ts`, `mock-data.ts`, `mock-service.ts` и `client.ts`.
- [x] `SettingsClient` теперь загружает данные через React Query и обрабатывает состояния загрузки, пустоты и ошибки.
- [x] Формы настроек валидируют SLA поддержки и пороги оповещений перед локальным обновлением UI.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/settings.test.tsx` и `npm.cmd run lint`.
- [x] Контракты A/B тестов маркетинга и моковые данные добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `MarketingClient` теперь имеет русскоязычный интерфейс кампаний и A/B тестов с загрузкой, пустыми состояниями, ошибками, валидацией, локальным созданием черновиков и выбором победителя.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/marketing.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты SMS/Push черновиков маркетинга, шаблонов и правил автоматизации добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `MarketingClient` теперь имеет русский конструктор сообщений, систему шаблонов, интерфейс правил автоматизации, предпросмотр, фильтры и валидацию.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/marketing.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Формат экспорта аналитики теперь поддерживает CSV, PDF и Excel на базе контрактных моков.
- [x] `AnalyticsClient` теперь имеет русский интерфейс отчетов, когорт, экспорта, валидации, загрузки, пустых и ошибочных состояний.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/analytics.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты и моковые данные расписанных отчетов аналитики добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `AnalyticsClient` теперь имеет русскую вкладку `Расписание` с созданием email-расписания, валидацией и таблицей расписанных отчетов.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/analytics.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты и моковые данные кастомных дашбордов аналитики добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `AnalyticsClient` теперь имеет русскую вкладку `Дашборды` с конструктором дашбордов, валидацией, списком дашбордов и превью виджетов.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/analytics.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты RBAC безопасности и моковые данные добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `SecurityClient` теперь имеет русские карточки ролей, матрицу разрешений, проверку назначения ролей, аудит и управление сессиями.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты истории аудита безопасности и моковые данные добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `SecurityClient` теперь имеет русский поиск аудита, фильтры риска, историю выбранных событий и локальное создание записей истории.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты истории сессий безопасности и моковые данные добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `SecurityClient` теперь имеет русский поиск сессий, фильтры риска/статуса, историю выбранных сессий и валидированное локальное завершение сессии.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты MFA безопасности и моковые данные добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `SecurityClient` теперь имеет русскую поддержку 2FA/MFA, фильтры администраторов, детали выбранного пользователя и валидированное редактирование политики.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты лимитирования API и заголовков безопасности и моковые данные добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `SecurityClient` теперь имеет русский UI политики лимитов API, заголовков безопасности, фильтров, деталей и валидированных локальных правок лимитов.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/security.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты баллов лояльности геймификации и моковые данные добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `GamificationClient` теперь имеет русский UI баллов лояльности, достижений, магазина наград и ответов на отзывы с валидацией и локальными обновлениями.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/gamification.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Контракты маркетинговых рефералов и купонов промо добавлены в `contracts.ts`, `mock-data.ts` и `mock-service.ts`.
- [x] `MarketingClient` теперь имеет русский UI программы рефералов и промокодов/купонов с фильтрами, локальным созданием и валидацией.
- [x] Фокусные проверки пройдены: `npm.cmd run test -- src/tests/marketing.test.tsx`, `npm.cmd run test -- src/tests/contracts.test.ts` и `npm.cmd run lint`.
- [x] Оставшиеся видимые строки UI админки переведены на русский язык в оболочке, dashboard, users, subscriptions, smart analytics, security policies, settings и рендеренных моковых метках.
- [x] Ожидаемые русские тесты UI обновлены для shell, dashboard, settings, smart analytics, security и smoke coverage.

---

## ❌ Не завершено

### Бэкенд и интеграция API
- [x] Frontend live API слой: `endpoints.ts`, `http-client.ts`, `client.ts`, `live-service.ts`.
- [x] Contract-first mock/live parity для основных модулей админки.
- [x] Подключены live-запросы dashboard, users CRM, subscriptions, marketing, analytics, notifications, security policies и gamification.
- [ ] Runtime-проверка против запущенного FastAPI `http://127.0.0.1:8000/docs`: реальные `401/404/503`, payload shapes, auth headers и fallback states.
- [ ] Полная реализация Python + FastAPI backend под все frontend-контракты.
- [ ] PostgreSQL база данных, миграции и seed/test data для admin-сценариев.
- [ ] Auth/profile parity: стабильный `/api/v1/auth/me`, refresh/logout/session invalidation, роли и permissions из backend.
- [ ] Backend endpoints для оставшихся gamification-сценариев: loyalty tiers CRUD, points ledger, manual grant/revoke, расширенный поиск отзывов.
- [ ] Backend endpoints для realtime jobs/anomalies и связанная invalidation в UI.
- [ ] Webhooks для событий подписок, платежей, рассылок, отзывов и внешних интеграций.

### Продвинутая аналитика
- [x] What-if сценарии (симулятор)
- [x] ML прогноз оттока
- [x] Анализ когорт
- [x] A/B тестирование
- [x] Экспорт в CSV/PDF/Excel
- [x] Расписанные отчеты (отправка по email)
- [x] Кастомные дашборды (конструктор)
- [ ] Runtime-проверка analytics reports/exports/schedules/jobs на live backend.
- [ ] Realtime/SSE обновления статусов долгих аналитических задач.

### RBAC и безопасность
- [x] Контроль доступа на основе ролей (RBAC)
- [x] Матрица разрешений
- [x] Журнал аудита + история изменений
- [x] Управление сессиями
- [x] 2FA / MFA
- [x] Лимитирование API
- [x] Заголовки безопасности
- [ ] Применить RBAC на backend, а не только в UI.
- [ ] Runtime-проверить security policies, audit/session history и error states на live backend.

### Маркетинг и геймификация (детально)
- [x] Конструктор SMS/Push рассылок
- [x] Система шаблонов
- [x] A/B сплит-тесты кампаний
- [x] Автоматизация (триггеры, правила автоматизации)
- [x] Программа лояльности (баллы лояльности)
- [x] Система достижений
- [x] Магазин наград
- [x] Реферальная программа
- [x] Промо-коды + купоны
- [x] CRUD/API-действия для achievements, rewards и модерации reviews подключены через client/live/mock слой.
- [x] Frontend API слой для loyalty summary, points ledger, manual grant/revoke и loyalty tiers подключён через client/live/mock слой.
- [ ] Расширенные формы редактирования marketing segments/edit/bulk и campaign automation.
- [ ] Runtime-подтверждение backend endpoints `/loyalty/summary`, `/loyalty/ledger`, `/loyalty/points/adjust` и `/loyalty/tiers`.
- [ ] Удаление loyalty tiers через backend, если сценарий нужен в UI.
- [ ] Расширенный backend-поиск отзывов и фильтры модерации.

### Биллинг и финансы (детально)
- [ ] Счета
- [ ] Платежные системы (Stripe, PayPal и др.)
- [ ] Повторяющаяся оплата
- [ ] Управление взысканиями (retry на неудачные платежи)
- [ ] Налоговые расчеты
- [x] Базовые MRR/ARR/churn метрики отображаются через dashboard/subscriptions API слой.
- [x] Транзакции, тарифы и финансовые события заведены в contract-first UI.
- [ ] Финансовые отчеты на реальных backend-данных.
- [ ] Reconciliation платежей, refunds, invoices и dunning workflows.
- [ ] Runtime-проверка subscription mutations на live backend.

### Уведомления и реальное время
- [ ] Firebase Cloud Messaging (FCM) — Android
- [ ] Apple Push Notifications (APNs) — iOS
- [ ] Email-уведомления
- [ ] SMS-уведомления
- [ ] Предпочтения уведомлений / отписка
- [x] Frontend notifications panel подключен к API списку уведомлений и mark-read действиям.
- [x] Frontend SSE/stream wiring для notifications подготовлен.
- [ ] Backend stream для notifications нужно подтвердить runtime-проверкой.
- [ ] SSE/WebSocket обновления для jobs, anomalies, exports и long-running actions.
- [ ] Уведомления от администратора пользователю через backend.

### Развёртывание и DevOps
- [ ] Docker-контейнеризация
- [ ] Docker Compose для локального dev
- [ ] Kubernetes манифесты
- [ ] CI/CD пайплайн (GitHub Actions / GitLab CI)
- [ ] Стейджинг окружение
- [ ] Продакшн окружение
- [ ] Резервное копирование базы данных
- [ ] Мониторинг и алертинг (Prometheus, Grafana)
- [ ] Логирование (ELK stack / Datadog)
- [ ] CDN для статичной статики

### Данные и интеграции
- [x] Contract-first bulk/action слой для части admin operations добавлен во frontend.
- [ ] Импорт пользователей (bulk) на backend и проверка больших файлов.
- [ ] Интеграции с внешними сервисами (Spotify, Netflix и др.)
- [ ] Analytics upstream (Mixpanel, Amplitude и др.)
- [ ] CRM интеграции (Salesforce, HubSpot)
- [ ] Синхронизация с мобильным приложением

---

## 🚀 Как запустить MVP

```bash
# 1. Установить зависимости
npm.cmd install

# 2. Развернуть dev-сервер
npm.cmd run dev
# Откроется: http://localhost:3000/dashboard
енд
# 3. Запустить тесты
npm.cmd run test                    # Unit/component тесты
npm.cmd run test:watch              # Режим наблюдения
npm.cmd run test:e2e                # smoke-тесты Playwright

# 4. Lint + typecheck
npm.cmd run lint
npm.cmd run typecheck
```

---

## 📝 Архитектурные решения

### Подход Contract-First
- UI строится на основе типизированных контрактов (`contracts.ts`)
- Mock-сервис реализует те же контракты
- Переключение на реальный API будет без изменения UI-компонентов

### Server Components (RSC) в приоритете
- Все страницы — Server Components по умолчанию
- Client Components используются только для интерактивности (shell, фильтры, формы)
- Данные загружаются на сервере и гидрируются без JS-фреймворка для статичного рендера

### Разделение управления состоянием
- **AdminShell local state** (Zustand) — UI-состояние (фильтр ролей, переключатель окружения, сворачивание, поиск)
- **React Query** — server state (пользователи, метрики, подписки)
- **Form state** — React + Zod для валидации

### Tailwind CSS v4 + HeroUI v3
- Новый `@theme` синтаксис вместо `tailwind.config.js`
- Dark-first дизайн (все компоненты в темной теме)
- HeroUI без Framer Motion (компоненты используют CSS-анимации)

---

## 🎯 Следующие приоритеты

1. **Этап 2:** FastAPI бэкенд + PostgreSQL
2. **Этап 3:** Аутентификация + RBAC
3. **Этап 4:** Продвинутая аналитика (What-if, прогноз оттока)
4. **Этап 5:** Маркетинг и геймификация детали
5. **Этап 6:** Deployment (Docker, CI/CD, Kubernetes)

---

## 📚 Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `src/lib/api/contracts.ts` | API DTOs и типы |
| `src/lib/api/client.ts` | Адаптер (переключатель mock ↔ real) |
| `src/lib/api/mock-service.ts` | Mock имплементация |
| `src/lib/query-client.tsx` | TanStack Query провайдер |
| `src/components/admin/admin-shell.tsx` | Главный shell компонент |
| `src/app/(admin)/layout.tsx` | Layout группы админ-маршрутов |
| `vitest.config.ts` | Конфигурация unit/component тестов |
| `playwright.config.ts` | Конфигурация E2E smoke тестов |

---

## ✨ Автор и дата

Сгенерирован: 23 мая 2026  
Автор: Реализовано на основе SPEC v1.5  
Контакт: SubHub Admin Team

---

## Обновление интеграции API - 2026-06-02

- Режим Live API подключён через `src/lib/api/http-client.ts`, `endpoints.ts`, `client.ts` и `live-service.ts`.
- Аутентификация теперь использует backend login / 2FA / refresh / logout эндпоинты. Админская оболочка теперь защищает приватные маршруты по access token.
- Рабочие зоны dashboard, users, subscriptions, tariffs, billing, marketing, smart analytics и security частично маппятся из `http://127.0.0.1:8000/api/v1`.
- Security workspace теперь читает backend audit logs, refresh sessions, admin users и system settings. Завершение сессии вызывает `DELETE /sessions/{jti}`.
- `docs/ADMIN_API_REQUIREMENTS.md` отслеживает полный набор backend API, необходимый для рабочей админ-консоли.
- Известные пробелы backend для полностью live admin: `/auth/me`, явный endpoint профиля, некоторые объекты политики для security/settings UI и глубокие action endpoints для модульных локальных контролов.
- Текущий frontend режим по-прежнему сохраняет mock-совместимые fallback, поэтому админ остаётся работоспособным, когда live backend данные неполны.

### Прогресс Settings API - 2026-06-02

- Оповещения настроек теперь используют backend `PATCH /api/v1/settings` для обновления порогов оттока.
- Нормализация live настроек мапит поля порогов backend в правила alert.
- Mock режим зеркалирует тот же путь обновления настроек для паритета UI.

### Прогресс Subscriptions API - 2026-06-02

- Операции подписок теперь вызывают backend `PATCH /api/v1/subscriptions/{subscription_id}` для renew, cancel, freeze и change_tariff.
- UI подписок обновляет локальные строки подписок после успешной мутации backend и обновляет запрос подписок.
- `apply_promo` по-прежнему блокируется в сообщении UI, потому что `POST /api/v1/subscriptions/{id}/apply-promo` пока отсутствует на backend.

### Прогресс Marketing API - 2026-06-02

- Создание кампаний теперь вызывает backend `POST /api/v1/campaigns` из маркетингового UI.
- Live и mock API сервисы экспонируют `createMarketingCampaign` для паритета.
- Список маркетинговых кампаний обновляется локально после создания и затем обновляет рабочую зону маркетинга.

### Действия маркетинговых кампаний - 2026-06-02

- Строки кампаний теперь показывают backend-поддерживаемые действия отправки и отмены.
- Send вызывает `POST /api/v1/campaigns/{campaign_id}/send` и помечает кампанию как отправляемую локально.
- Cancel вызывает `POST /api/v1/campaigns/{campaign_id}/cancel` и сохраняет отменённый статус как отдельный статус кампании.

### Прогресс API профиля администратора - 2026-06-02

- Контракты фронтенда auth теперь включают `AdminProfile` и ожидают `GET /api/v1/auth/me`.
- Админская оболочка запрашивает live профиль администратора после логина и отображает backend имя, email, роль, аватар, состояние MFA и количество разрешений, когда доступно.
- Пока backend не реализует `/auth/me`, оболочка использует данные идентичности из JWT, чтобы защищённые admin маршруты оставались доступными.

### Каталог требований Admin API - 2026-06-03

- `docs/ADMIN_API_REQUIREMENTS.md` был переписан в полный Markdown-каталог для работающего API админ-консоли.
- Каталог теперь разделяет backend endpoints и требуемые отсутствующие/расширенные endpoints, охватывая метрики, CRM, подписки, биллинг, маркетинг, геймификацию, аналитику, безопасность, настройки, задания, realtime, уведомления, экспорты, пагинацию, фильтры и unified errors.
- Источник backend остаётся `G:\Repository\submart_backend\docs\API.md`; live OpenAPI источник остаётся `http://127.0.0.1:8000/docs`.

### Прогресс API промокодов маркетинга - 2026-06-03

- Создание промокодов в маркетинговом UI теперь вызывает backend `POST /api/v1/promo-codes`.
- Live и mock API сервисы экспонируют `createMarketingPromoCode` со структурой backend `PromoRequest`: `code`, `discount_type`, `discount_value`, `max_uses`, `expires_at`.
- Список промокодов обновляется локально после создания и затем обновляет рабочую зону маркетинга.

### Действия удаления/деактивации маркетинга - 2026-06-03

- Строки кампаний теперь поддерживают backend-поддерживаемое удаление через `DELETE /api/v1/campaigns/{campaign_id}`.
- Карточки промокодов теперь поддерживают backend-поддерживаемую деактивацию через `DELETE /api/v1/promo-codes/{promo_id}`.
- Паритет mock API дублирует оба действия, чтобы mock/live режимы сохраняли одинаковое поведение UI.

### Прогресс автоматизаций Smart analytics - 2026-06-03

- Smart analytics теперь читает retention automations из backend `GET /api/v1/automations`.
- Действие предпросмотра автоматизации теперь запускает выбранную автоматизацию через `POST /api/v1/automations/{automation_id}/run`.
- Live нормализация мапит триггеры/действия/статусы backend в UI карточки smart analytics.
- Паритет mock API экспонирует тот же метод `runSmartAutomation`, чтобы mock/live режимы сохраняли одинаковое поведение UI.

### Прогресс API действий CRM пользователей - 2026-06-03

- Действия профиля пользователя теперь поддерживают backend-поддерживаемую разблокировку через `POST /api/v1/users/{user_id}/unblock`.
- Операции с баллами теперь поддерживают пути grant и deduct через `POST /api/v1/users/{user_id}/grant-points` и `POST /api/v1/users/{user_id}/deduct-points`.
- Записи оператора теперь вызывают `POST /api/v1/users/{user_id}/notes` и обновляют выбранный профиль пользователя.
- Паритет mock API дублирует unblock, deduct points и создание заметок для одинакового поведения UI в mock/live режиме.

### Прогресс API экспорта и массовых операций пользователей - 2026-06-03

- Экспорт списка пользователей теперь вызывает backend `GET /api/v1/users/export` и отображает queued job id.
- Флажки в таблице пользователей теперь сохраняют состояние выбранности строки, а не являются только визуальными контролами.
- Массовая блокировка/разблокировка теперь вызывает backend `POST /api/v1/users/bulk-action` с выбранными `user_ids` и обновляет пользователей после постановки в очередь.
- Паритет mock API дублирует export jobs и массовые обновления статусов для одинакового поведения UI в mock/live режиме.

### Завершение данных live dashboard - 2026-06-03

- Dashboard теперь читает backend `GET /api/v1/dashboard/new-users` для виджета новых пользователей.
- Dashboard теперь читает backend `GET /api/v1/dashboard/risk-summary` для итогов риска оттока и распределения по корзинам.
- KPI карточки больше не хардкодят MRR и проценты роста; значение MRR, ARR и дельты теперь берутся из `GET /api/v1/dashboard/kpis`.
- Паритет mock API дублирует endpoints dashboard new-users и risk-summary для одинакового поведения UI в mock/live режиме.

### Обработка ошибок auth и dashboard - 2026-06-03

- Админская оболочка теперь ждёт snapshot access-token браузера перед рендером защищённых маршрутов, что предотвращает отправку запросов dashboard до определения auth.
- Live профиль администратора больше не вызывает отсутствующий `GET /api/v1/auth/me`; пока backend не реализует его, оболочка использует данные идентичности из JWT.
- Защищённые запросы API теперь очищают сохранённый access token при `401 Unauthorized`, позволяя оболочке перенаправлять на login вместо повторных попыток со старым токеном.
- Dashboard `risk-summary` теперь считается необязательным endpoint backend: если запущенный backend возвращает `404`, live сервис выводит сводку риска на основе `GET /api/v1/users`.

### Прогресс Notifications API - 2026-06-03

- Уведомления админской оболочки теперь загружаются из backend `GET /api/v1/notifications` вместо локального жесткого списка popover.
- Действия пометки как прочитано вызывают `PATCH /api/v1/notifications/{notification_id}` со `status: "read"`.
- Действия скрытия прочитанных архивируют уведомления через тот же endpoint со `status: "archived"`.
- Live нормализация мапит payload/status/severity backend в контракт popover, и паритет mock API дублирует логику списка/чтения/архива.

### Дальнейшая интеграция live API админки - 2026-06-03

- Обновления realtime уведомлений теперь подключаются к backend `GET /api/v1/stream/notifications` с авторизованным fetch stream и инвалидируют данные notifications/dashboard по событиям уведомлений.
- Список уведомлений с `404` обрабатывается как отсутствующий backend маршрут для текущей сборки API, что предотвращает повторные retries React Query и шум в консоли.
- React Query больше не повторяет `401`, `403` или `404` глобально; устаревшие учетные данные теперь отрабатывают один раз и позволяют guard перенаправить.
- Заголовок CRM пользователей теперь использует live totals из `/users` вместо хардкодных фейковых значений, а export заголовка вызывает `GET /api/v1/users/export`.
- CRM пользователей теперь показывает явное состояние ошибки API для `401 Unauthorized`/других backend ошибок вместо отображения пустой таблицы как будто пользователей нет.
- Subscriptions теперь поверхностно показывает частичные live ошибки API для подписок, транзакций, шлюзов или отчёта биллинга вместо fallback на фейковые финансовые события/отчёты.
- Профиль администратора теперь пытается `GET /api/v1/auth/me` и при отсутствии реализованности падает на `GET /api/v1/admin-users/{jwt.sub}`.
- Применение промо подписки теперь вызывает backend `POST /api/v1/subscriptions/{subscription_id}/apply-promo` с `{ code }` из формы операции.

### Текущее состояние API - 2026-06-04

- Интеграция live API централизована в `src/lib/api/endpoints.ts`, `http-client.ts`, `client.ts` и `live-service.ts`; компонентам не стоит напрямую вызывать backend.
- `apiEndpoints` уже содержит `stream/anomalies`, `stream/notifications` и широкую mobile-namespace, а `live-service` реализует методы `getJobs`, `getJob`, `cancelJob`, `getNotifications` и `updateNotificationStatus`.
- Самое сильное покрытие live API сейчас в users, subscriptions, marketing, analytics exports/jobs, security policies, settings, notifications и core actions геймификации.
- Runtime parity по-прежнему требует валидацию против запущенного FastAPI: `401`, `404` и частично `503` остаются факторами, особенно для защищённых dashboard и profile endpoint'ов.
- Realtime пока частичное: notifications stream готов на уровне контрактов и frontend reader, а anomalies stream определён в endpoint'ах, но backend-подтверждение и invalidation wiring пока остаются задачами.

### Анализ текущего состояния - 2026-06-05

- Общий прогресс остаётся `82/100`: API-контракты, mock-сервис и основные UI-модули готовы, но полная готовность зависит от runtime-проверки против запущенного FastAPI.
- Backend FastAPI оценивается в `70%`: основные live API paths подключены во frontend, но ещё нужны стабильные ответы для auth/profile, realtime jobs/anomalies, loyalty tiers и points ledger.
- SSE/realtime оценивается в `35%`: notifications stream уже подключён на стороне frontend, anomalies endpoint отражён в карте API, но jobs/anomalies invalidation и backend-подтверждение ещё не закрыты.
- Gamification стал самым свежим закрытым UI/API-срезом: achievements/rewards/reviews больше не являются mock-only actions и работают через `client.ts`/`live-service.ts`/`mock-service.ts`.
- Главные риски следующего этапа: возможные `401/404` при live-запуске, неполные backend payload shapes, отсутствие runtime smoke against `http://127.0.0.1:8000/docs`, и оставшиеся UI-действия без backend-потока событий.
- Ближайшие приоритеты: runtime FastAPI validation, SSE jobs/anomalies, loyalty tiers CRUD, points ledger/manual grant-revoke, расширенные формы marketing и расширенный поиск отзывов.

### Прогресс маркетинга, аналитики и заданий API - 2026-06-04

- Слои API contract/client/live/mock теперь экспонируют маркетинговые сегменты, шаблоны, массовую генерацию промо, реферальную конфигурацию, аналитические отчеты/экспорты/расписанные отчеты и jobs list/detail/cancel.
- Рабочая зона маркетинга теперь загружает backend `GET /api/v1/templates` в дополнение к кампаниям, промокодам, сегментам, рефералам и автоматизациям.
- Рабочая зона аналитики теперь загружает `GET /api/v1/analytics/reports`, `GET /api/v1/analytics/exports` и `GET /api/v1/analytics/scheduled-reports`.
- Кнопки экспорта аналитики теперь вызывают `POST /api/v1/analytics/exports`; форма расписанного отчета теперь вызывает `POST /api/v1/analytics/scheduled-reports`.
- UI аналитики теперь читает `GET /api/v1/jobs` и может отменять queued/running jobs через `DELETE /api/v1/jobs/{job_id}`.

### Прогресс редактирования маркетинга - 2026-06-04

- Строки кампаний теперь показывают backend-поддерживаемое действие сохранения через `PATCH /api/v1/campaigns/{campaign_id}`.
- Карточки промокодов теперь показывают backend-поддерживаемое быстрое обновление лимита через `PATCH /api/v1/promo-codes/{promo_id}`.
- Детали шаблона теперь показывают backend-поддерживаемый переключатель статуса через `PATCH /api/v1/templates/{template_id}`.
- В маркетинге теперь есть вкладка `Сегменты`, которая читает backend сегменты, создаёт сегменты через `POST /api/v1/segments` и обновляет размер аудитории через `POST /api/v1/segments/{segment_id}/refresh`.

### Прогресс API политики безопасности - 2026-06-04

- Security workspace теперь читает backend `GET /api/v1/security/policies` и объединяет политику MFA, правила лимитирования и политику заголовков безопасности в существующую модель security dashboard.
- Сохранение политики MFA, правила лимитирования и переключение статуса заголовков безопасности теперь вызывают `PATCH /api/v1/security/policies`.
- Mock режим теперь сохраняет обновления политик, сохраняя паритет mock/live для MFA, лимитов и header policy.
- Оставшиеся шаги: добавить полные формы редактирования всех полей политики безопасности, добавить селектор ролей/IP allowlist и показать историю изменений/аудит.

### Прогресс API геймификации - 2026-06-04

- Текущее состояние: рабочая зона геймификации загружала достижения, награды, историю наград и отзывы, но действия create/redeem/reply в UI были локальными.
- Слои API contract/client/live/mock теперь экспонируют создание/обновление/удаление достижений, создание/обновление/удаление наград, обновление модерации отзывов и ответ на отзыв.
- Live загрузка рабочей зоны геймификации теперь нормализует достижения, награды, историю наград и отзывы до потребления UI.
- Сохранение достижения теперь вызывает `POST /api/v1/achievements`.
- Действия редактирования/удаления достижений теперь вызывают `PATCH /api/v1/achievements/{achievement_id}` и `DELETE /api/v1/achievements/{achievement_id}` из видимого UI.
- Создание/удаление наград теперь вызывают `POST /api/v1/rewards` и `DELETE /api/v1/rewards/{reward_id}` из видимого UI.
- Выкуп/обновление награды теперь вызывает `PATCH /api/v1/rewards/{reward_id}` и сохраняет паритет состояния mock/live.
- Ответ на отзыв теперь вызывает `POST /api/v1/reviews/{review_id}/reply`.
- Оставшиеся шаги: более подробные формы достижений и наград, CRUD уровней лояльности, журнал баллов/ручная выдача/аннулирование, фильтры модерации и статусные контролы.

### Прогресс полного UI геймификации - 2026-06-04

- Текущее состояние: методы API обновления/удаления достижений и наград существовали после предыдущего среза, но страница показывала только создание достижений, выкуп наград и ответ на отзывы.
- Строки достижений теперь показывают действия редактирования и удаления; редактирование повторно использует существующий конструктор достижения и сохраняет через `PATCH /api/v1/achievements/{achievement_id}`.
- Магазин наград теперь показывает компактную форму создания и действие удаления; создание/удаление используют `POST /api/v1/rewards` и `DELETE /api/v1/rewards/{reward_id}`.
- Mock режим теперь сохраняет созданные, обновлённые и удалённые сущности геймификации через те же API методы на стороне клиента.
- Оставшиеся шаги: добавить CRUD уровней лояльности, журнал баллов/ручную выдачу/аннулирование через backend, фильтры/статусные контролы модерации и runtime валидацию на запущенном FastAPI backend.

### Прогресс модерации отзывов геймификации - 2026-06-05

- Текущее состояние: `PATCH /api/v1/reviews/{review_id}` уже был реализован в contract/client/live/mock слоях, но вкладка отзывов показывала только отправку ответа.
- Вкладка отзывов теперь фильтрует очередь модерации по статусу и тональности.
- Панель выбранного отзыва теперь показывает действия перевода в работу и закрытия; оба действия вызывают `PATCH /api/v1/reviews/{review_id}` через общий API client.
- Отправка ответа остаётся отдельным backend action через `POST /api/v1/reviews/{review_id}/reply`, поэтому reply и moderation status больше не смешаны в UI.
- Оставшиеся шаги: CRUD уровней лояльности, журнал баллов/ручная выдача/аннулирование, расширенный поиск по отзывам и runtime валидация на запущенном FastAPI backend.

### Прогресс live API геймификации и ошибок - 2026-06-05

- В live/mock/client API добавлено удаление loyalty tier через `DELETE /api/v1/loyalty/tiers/{tier_id}`.
- Вкладка геймификации теперь показывает backend-facing действие удаления уровня лояльности и обновляет список только после успешного ответа API.
- Ручное начисление loyalty points больше не содержит недостижимый локальный fallback, который мог создавать видимость успешного начисления без подтверждения backend.
- `apiRequest` теперь нормализует сетевую недоступность live backend в `ApiError` со статусом `503` и кодом `NETWORK_ERROR`, сохраняя `AbortError` как отмену запроса.
- Runtime probe `http://127.0.0.1:8000/openapi.json` сейчас не прошёл: backend недоступен (`Unable to connect to the remote server`), поэтому проверка реальных payload shapes остаётся открытой.
- Проверки без тестов выполнены: `npm.cmd run typecheck` и `npm.cmd run lint` прошли успешно.
- Следующий шаг: поднять FastAPI backend, сверить OpenAPI/runtime endpoints для loyalty tiers/ledger/points adjust, затем продолжить SSE anomalies/jobs и расширенный поиск отзывов.

### Прогресс runtime API parity - 2026-06-05

- FastAPI OpenAPI probe теперь отвечает `200` на `http://127.0.0.1:8000/openapi.json`.
- Подтверждены backend paths: dashboard, sessions, jobs, reviews, stream notifications/anomalies.
- В текущем OpenAPI отсутствуют `/api/v1/loyalty/summary`, `/api/v1/loyalty/ledger`, `/api/v1/loyalty/points/adjust` и `/api/v1/loyalty/tiers`, поэтому loyalty UI остаётся frontend-ready, но backend runtime parity не закрыт.
- Dashboard header теперь берёт `updated_at` из `GET /api/v1/dashboard/kpis`; mock режим обновляет timestamp при каждом запросе.
- Security sessions UI форматирует ISO timestamps в локальное русское время и схлопывает дубли backend по `status + admin + ip + device`, оставляя свежую сессию.
- `live-service` теперь умеет читать backend envelopes с полезной нагрузкой в `data`, сохраняя list pagination metadata для users/jobs/notifications.
- Добавлен backend implementation checklist: `docs/BACKEND_API_IMPLEMENTATION_TODO.md` с P0 loyalty endpoints, бизнес-логикой, parity gaps и acceptance checklist.
- Следующий шаг: проверить authenticated live payloads dashboard/sessions/jobs с валидным токеном и продолжить parity для отсутствующих loyalty endpoints на backend.
