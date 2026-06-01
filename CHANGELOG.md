# SubHub Admin Console — CHANGELOG

## [1.5] — 24 мая 2026 (Major Feature Release)

### ✨ Новые компоненты и фичи

#### 📊 Smart Analytics (`/smart-analytics`)
- [x] **ML Churn Prediction** — вероятность оттока для каждого пользователя с top-10 факторами
- [x] **What-If сценарии** — интерактивные слайдеры для симуляции влияния на KPI
  - Изменение цены тарифа (-50% ... +100%)
  - Целевое снижение Churn (0 ... -5 п.п.)
  - Изменение CAC (-50% ... +100%)
  - Прирост пользователей (0 ... +200%)
  - Горизонт прогноза (1–24 месяца)
- [x] **Прогноз MRR/ARR** — график + метрики на N месяцев вперёд
- [x] **Сегментация риска** — группировка по Высокий/Средний/Низкий с действиями

#### 📈 Analytics (`/analytics`)
- [x] **Reporting engine** — создание кастомных отчётов с выбором метрик и периода
- [x] **Cohort analysis** — анализ когорт пользователей по дате регистрации
- [x] **Export formats** — CSV, PDF, Excel с валидацией перед скачиванием
- [x] **Scheduled reports** — планирование отправки отчётов по email
  - Выбор расписания (ежедневно/еженедельно/ежемесячно)
  - Цель письма и формат доставки
- [x] **Custom dashboards** — конструктор дашбордов с drag-and-drop виджетами
  - Выбор метрик для виджетов
  - Сохранение в черновики
  - Предпросмотр и валидация

#### 🎯 Marketing (`/marketing`)
- [x] **Email/SMS/Push campaigns** — конструктор рассылок с поддержкой всех каналов
- [x] **Campaign A/B testing** — создание вариантов, метрики, определение победителя
- [x] **SMS/Push constructor** — визуальный редактор сообщений
- [x] **Message templates** — сохранение и переиспользование шаблонов
- [x] **Automation rules** — триггеры на события (подписка, оттек, неактивность)
- [x] **Referral program** — настройка вознаграждений реферера/реферала
- [x] **Promo codes & coupons** — CRUD коды, скидки, ограничения, история использования
  - Генерация N уникальных кодов по шаблону
  - Разные типы: % / фиксированная сумма / бесплатный период
  - Применимость к тарифам и лимиты по количеству

#### 🎮 Gamification (`/gamification`)
- [x] **Achievement system** — CRUD достижений с условиями триггеров
  - Названия, описание, иконки
  - Награды: баллы / бейджи / доступ к тарифу
- [x] **Reward shop** — каталог товаров за баллы с остатком
- [x] **Loyalty points** — начисление/списание баллов, история операций
- [x] **App reviews aggregation** — сбор отзывов с App Store, Google Play, Trustpilot
  - Анализ тональности (Positive/Neutral/Negative)
  - Автоматические теги (оплата, поддержка, контент)
  - Ответы от компании

#### 🔐 Security (`/security`)
- [x] **RBAC (Role-Based Access Control)** — управление ролями и разрешениями
  - Суперадмин, финансовый менеджер, маркетолог, служба поддержки, аналитик
  - Permission matrix — выбор прав для каждой роли
- [x] **Audit history** — полный лог действий администраторов
  - Фильтры по типу, пользователю, дате
  - Риск-оценка операции
- [x] **Session management** — контроль активных сессий администраторов
  - Просмотр активных сессий по пользователям
  - Принудительное завершение сессии
  - История по рискам и типам сессий
- [x] **2FA / MFA** — управление двухфакторной аутентификацией
  - Покрытие по пользователям
  - Типы: SMS, Email, Authenticator app
- [x] **API rate limiting** — настройка лимитов запросов
  - По IP / по ключу / глобальные
  - Разные лимиты для разных endpoints
- [x] **Security headers** — управление заголовками безопасности
  - HSTS, CSP, X-Frame-Options, X-Content-Type-Options и др.
  - Список политик с описанием

#### ⚙️ Settings (`/settings`)
- [x] **System configuration** — черновики конфигов, валидация
- [x] **Integration settings** — управление подключениями к внешним сервисам
  - Spotify, Netflix, и др.
- [x] **Alert rules** — создание и редактирование правил алертов
  - Пороги для KPI (Churn, MRR падение, платежи)
  - Типы уведомлений и получатели
  - История срабатываний

### 🧪 Тестирование

- [x] `src/tests/smart-analytics.test.tsx` — полное покрытие Smart Analytics
- [x] `src/tests/analytics.test.tsx` — тесты Analytics + Reports + Cohorts + Exports + Dashboards
- [x] `src/tests/marketing.test.tsx` — тесты Marketing + Campaigns + A/B tests + SMS/Push + Automation + Referrals + Promos
- [x] `src/tests/gamification.test.tsx` — тесты Gamification + Achievements + Rewards + Loyalty + Reviews
- [x] `src/tests/security.test.tsx` — тесты Security + RBAC + Audit + Sessions + 2FA + Rate Limits + Headers
- [x] `src/tests/settings.test.tsx` — тесты Settings + Config + Integrations + Alerts

### 📋 API Contracts

- [x] `SmartAnalyticsDTO` — ML predictions, what-if params, forecast results
- [x] `AnalyticsReportDTO`, `CohortDTO`, `ExportQueueDTO`, `ScheduledReportDTO`, `CustomDashboardDTO`
- [x] `CampaignDTO`, `ABTestDTO`, `MessageTemplateDTO`, `AutomationRuleDTO`, `ReferralProgramDTO`, `PromoCouponDTO`
- [x] `AchievementDTO`, `RewardShopDTO`, `LoyaltyPointDTO`, `AppReviewDTO`
- [x] `RoleDTO`, `PermissionDTO`, `AuditEventDTO`, `SessionDTO`, `MFAPolicyDTO`, `RateLimitPolicyDTO`, `SecurityHeaderDTO`
- [x] `AlertRuleDTO`, `IntegrationSettingDTO`

### 🔄 Mock Data & Services

- [x] Детерминированные фиксчуры для всех новых DTOs в `mock-data.ts`
- [x] In-memory реализация всех endpoints в `mock-service.ts`
- [x] Адаптер `client.ts` готов к переключению на real FastAPI endpoints

### 📊 Статистика

| Метрика | Было | Стало | Прирост |
|---------|------|-------|---------|
| Роутов | 4 | 9 | +5 |
| Компонентов | 5 | 20+ | +15+ |
| Тестов | 4 | 13 | +9 |
| API контрактов | 8 | 30+ | +22+ |
| Строк в contracts.ts | ~500 | ~2500 | +2000 |
| Mock fixtures | 100+ | 500+ | +400 |
| Прогресс MVP | 50% | 74% | +24% |

---

## [1.0] — 19–21 мая 2026 (Initial MVP)

### 🚀 Инфраструктура
- [x] Next.js 16 App Router + React 19
- [x] Tailwind CSS v4 + HeroUI v3
- [x] Vitest + Playwright
- [x] TanStack Query + Zustand

### 🏗️ Архитектура
- [x] Contract-first API design
- [x] Mock service + adapter pattern
- [x] Server Components (RSC) first
- [x] Type-safe DTOs (Zod)

### 📱 Компоненты
- [x] Admin Shell (sidebar, header, search, notifications)
- [x] Mobile drawer + responsive layout
- [x] Dashboard (KPI, MRR chart, anomalies, top services)
- [x] Users CRM (table, search, filters, pagination, profile, bulk actions)
- [x] Subscriptions (tariff management, status tracking)

### ✅ Тестирование
- [x] `shell.test.tsx` — полное покрытие shell-функционала
- [x] Unit + smoke tests (desktop & mobile)
- [x] Contract validation tests

### 📚 Документация
- [x] `SPEC_SubHub_Admin_Dashboard.md` — спецификация v1.5
- [x] `AGENTS.md` — architecture notes
- [x] `README.md` — project overview

---

## 🔮 Планы на Phase 2

### Backend
- [ ] FastAPI бэкенд на Python
- [ ] PostgreSQL миграции
- [ ] JWT аутентификация
- [ ] Webhooks & Event system

### Notifications & Real-time
- [ ] SSE потоки (аномалии)
- [ ] Firebase Cloud Messaging (FCM)
- [ ] Apple Push Notifications (APNs)
- [ ] Email & SMS шлюзы

### Deployment
- [ ] Docker контейнеризация
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging & Production окружения

### Интеграции
- [ ] Spotify, Netflix, и др. API
- [ ] Stripe, Robokassa платежи
- [ ] Analytics upstream (Mixpanel, Amplitude)
- [ ] CRM (Salesforce, HubSpot)

---

## 🎯 Версионирование

- **v1.5 (текущая)** — MVP с 9 модулями, contract-first, mock data
- **v2.0 (планируется)** — Real FastAPI backend, production deployment
- **v3.0 (future)** — Advanced ML, real-time notifications, full integrations

---

## 📝 Как читать этот файл

Используй этот CHANGELOG для:
- **Быстрого обзора** — что было добавлено в каждой версии
- **Отслеживания прогресса** — сравни % между версиями
- **Планирования Phase 2** — см. раздел "Планы на Phase 2"

Подробное описание каждой фичи → см. [SPEC_SubHub_Admin_Dashboard.md](docs/SPEC_SubHub_Admin_Dashboard.md)

Текущий статус → см. [STATUS.md](docs/STATUS.md)
