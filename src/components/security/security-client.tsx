"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Clock,
  FileLock2,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  assignSecurityRole,
  getSecurityWorkspace,
  terminateAdminSession,
  updateSecurityPolicies,
} from "@/lib/api/client";
import type {
  AdminSession,
  SecurityAccessRule,
  SecurityAuditEvent,
  SecurityChangeHistory,
  SecurityMfaFactor,
  SecurityMfaPolicy,
  SecurityMfaStatus,
  SecurityPoliciesPatchRequest,
  SecurityMfaUser,
  SecurityPermissionRow,
  SecurityHeaderPolicy,
  SecurityPolicyStatus,
  SecurityRateLimitRule,
  SecurityRole,
  SecurityRoleAssignment,
  SecurityRoleKey,
  SecuritySeverity,
  SecuritySessionHistory,
  SecurityTabStatus,
} from "@/lib/api/contracts";
import { cn } from "@/lib/utils";

type SecurityTab = "roles" | "audit" | "mfa" | "policies" | "sessions";
type AssignmentForm = {
  reason: string;
  role: SecurityRoleKey;
  user: string;
};
type AssignmentErrors = Partial<Record<keyof AssignmentForm, string>>;
type AuditSeverityFilter = "all" | SecuritySeverity;
type HistoryForm = {
  auditEventId: string;
  description: string;
};
type HistoryErrors = Partial<Record<keyof HistoryForm, string>>;
type SessionRiskFilter = "all" | SecuritySeverity;
type SessionStatusFilter = "all" | AdminSession["status"];
type SessionForm = {
  reason: string;
};
type SessionErrors = Partial<Record<keyof SessionForm, string>>;
type MfaStatusFilter = "all" | SecurityMfaStatus;
type MfaPolicyForm = {
  backupCodesRequired: string;
  gracePeriodDays: string;
  minCoveragePct: string;
};
type MfaPolicyErrors = Partial<Record<keyof MfaPolicyForm, string>>;
type PolicyStatusFilter = "all" | SecurityPolicyStatus;
type RateLimitForm = {
  burst: string;
  limit: string;
  reason: string;
  windowSeconds: string;
};
type RateLimitErrors = Partial<Record<keyof RateLimitForm, string>>;

function sessionTimeValue(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatSessionTime(value: string) {
  const timestamp = sessionTimeValue(value);

  if (!timestamp) {
    return value || "Нет данных";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function sessionGroupKey(session: AdminSession) {
  return [
    session.status,
    session.admin.trim().toLocaleLowerCase("ru-RU"),
    session.ip.trim().toLocaleLowerCase("ru-RU"),
    session.device.trim().toLocaleLowerCase("ru-RU"),
  ].join("|");
}

function uniqueLatestSessions(sessions: AdminSession[]) {
  const groups = new Map<string, AdminSession>();

  sessions.forEach((session) => {
    const key = sessionGroupKey(session);
    const current = groups.get(key);

    if (!current || sessionTimeValue(session.last_seen) >= sessionTimeValue(current.last_seen)) {
      groups.set(key, session);
    }
  });

  return Array.from(groups.values()).sort(
    (first, second) => sessionTimeValue(second.last_seen) - sessionTimeValue(first.last_seen),
  );
}

const emptyAccessRules: SecurityAccessRule[] = [];
const emptyAuditEvents: SecurityAuditEvent[] = [];
const emptyHistory: SecurityChangeHistory[] = [];
const emptyMatrix: SecurityPermissionRow[] = [];
const emptyRoles: SecurityRole[] = [];
const emptyAssignments: SecurityRoleAssignment[] = [];
const emptySessions: AdminSession[] = [];
const emptySessionHistory: SecuritySessionHistory[] = [];
const emptyMfaUsers: SecurityMfaUser[] = [];
const emptyRateLimitRules: SecurityRateLimitRule[] = [];
const emptyHeaderPolicies: SecurityHeaderPolicy[] = [];
const emptyMfaPolicy: SecurityMfaPolicy = {
  backup_codes_required: 0,
  grace_period_days: 0,
  min_coverage_pct: 0,
  required_for_roles: [],
  updated_at: "",
};

const tabLabel: Record<SecurityTab, string> = {
  audit: "Журнал аудита",
  mfa: "2FA/MFA",
  policies: "Политики",
  roles: "Роли",
  sessions: "Сессии",
};

const accessStatusClass: Record<SecurityTabStatus, string> = {
  active: "bg-success/10 text-success",
  expired: "bg-muted/20 text-text-secondary",
  review: "bg-info/10 text-info",
};

const accessStatusLabel: Record<SecurityTabStatus, string> = {
  active: "Активно",
  expired: "Истекло",
  review: "На проверке",
};

const severityClass: Record<SecuritySeverity, string> = {
  high: "bg-danger/10 text-danger",
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
};

const severityLabel: Record<SecuritySeverity, string> = {
  high: "Высокий",
  low: "Низкий",
  medium: "Средний",
};

const roleKeyLabel: Record<SecurityRoleKey, string> = {
  analyst: "Аналитик",
  finance: "Финансы",
  owner: "Владелец",
  security: "Безопасность",
  support: "Поддержка",
};

const mfaStatusClass: Record<SecurityMfaStatus, string> = {
  disabled: "bg-danger/10 text-danger",
  enabled: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
};

const mfaStatusLabel: Record<SecurityMfaStatus, string> = {
  disabled: "Отключена",
  enabled: "Включена",
  pending: "Ожидает настройки",
};

const mfaFactorLabel: Record<SecurityMfaFactor, string> = {
  sms: "SMS",
  totp: "TOTP",
  webauthn: "Аппаратный ключ",
};

const policyStatusClass: Record<SecurityPolicyStatus, string> = {
  active: "bg-success/10 text-success",
  disabled: "bg-muted/20 text-text-secondary",
  review: "bg-warning/10 text-warning",
};

const policyStatusLabel: Record<SecurityPolicyStatus, string> = {
  active: "Активна",
  disabled: "Отключена",
  review: "На проверке",
};

const assignmentSchema = z.object({
  reason: z.string().trim().min(5, "Причина должна быть не короче 5 символов"),
  role: z.enum(["owner", "security", "support", "finance", "analyst"]),
  user: z.string().trim().min(3, "Имя пользователя должно быть не короче 3 символов"),
});

const historySchema = z.object({
  auditEventId: z.string().min(1, "Выберите событие аудита"),
  description: z.string().trim().min(8, "Описание должно быть не короче 8 символов"),
});

const sessionSchema = z.object({
  reason: z.string().trim().min(8, "Причина должна быть не короче 8 символов"),
});

const mfaPolicySchema = z.object({
  backupCodesRequired: z.coerce
    .number()
    .int("Количество кодов должно быть целым числом")
    .min(4, "Нужно минимум 4 резервных кода")
    .max(20, "Максимум 20 резервных кодов"),
  gracePeriodDays: z.coerce
    .number()
    .int("Период должен быть целым числом")
    .min(1, "Период должен быть не меньше 1 дня")
    .max(30, "Период должен быть не больше 30 дней"),
  minCoveragePct: z.coerce
    .number()
    .int("Покрытие должно быть целым числом")
    .min(80, "Покрытие должно быть не ниже 80%")
    .max(100, "Покрытие не может быть выше 100%"),
});

const rateLimitSchema = z.object({
  burst: z.coerce
    .number()
    .int("Burst должен быть целым числом")
    .min(1, "Burst должен быть больше 0")
    .max(500, "Burst не должен превышать 500"),
  limit: z.coerce
    .number()
    .int("Лимит должен быть целым числом")
    .min(10, "Лимит должен быть не меньше 10 запросов")
    .max(10000, "Лимит должен быть не больше 10000 запросов"),
  reason: z.string().trim().min(8, "Причина должна быть не короче 8 символов"),
  windowSeconds: z.coerce
    .number()
    .int("Окно должно быть целым числом")
    .min(10, "Окно должно быть не меньше 10 секунд")
    .max(3600, "Окно должно быть не больше 3600 секунд"),
});

function permissionValue(value: boolean) {
  return value ? "Да" : "Нет";
}

export function SecurityClient() {
  const workspaceQuery = useQuery({
    queryFn: getSecurityWorkspace,
    queryKey: ["security-workspace"],
  });
  const [activeTab, setActiveTab] = useState<SecurityTab>("roles");
  const [localAssignments, setLocalAssignments] = useState<SecurityRoleAssignment[] | null>(null);
  const [localHistory, setLocalHistory] = useState<SecurityChangeHistory[] | null>(null);
  const [localSessions, setLocalSessions] = useState<AdminSession[] | null>(null);
  const [localSessionHistory, setLocalSessionHistory] = useState<SecuritySessionHistory[] | null>(
    null,
  );
  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    reason: "",
    role: "support",
    user: "",
  });
  const [assignmentErrors, setAssignmentErrors] = useState<AssignmentErrors>({});
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [auditFilter, setAuditFilter] = useState<AuditSeverityFilter>("all");
  const [auditSearch, setAuditSearch] = useState("");
  const [historyForm, setHistoryForm] = useState<HistoryForm>({
    auditEventId: "",
    description: "",
  });
  const [historyErrors, setHistoryErrors] = useState<HistoryErrors>({});
  const [historyMessage, setHistoryMessage] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const [sessionRiskFilter, setSessionRiskFilter] = useState<SessionRiskFilter>("all");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState<SessionStatusFilter>("all");
  const [sessionForm, setSessionForm] = useState<SessionForm>({ reason: "" });
  const [sessionErrors, setSessionErrors] = useState<SessionErrors>({});
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState("");
  const [mfaSearch, setMfaSearch] = useState("");
  const [mfaStatusFilter, setMfaStatusFilter] = useState<MfaStatusFilter>("all");
  const [mfaRiskFilter, setMfaRiskFilter] = useState<AuditSeverityFilter>("all");
  const [selectedMfaUserId, setSelectedMfaUserId] = useState<string | null>(null);
  const [localMfaPolicy, setLocalMfaPolicy] = useState<SecurityMfaPolicy | null>(null);
  const [mfaPolicyForm, setMfaPolicyForm] = useState<MfaPolicyForm>({
    backupCodesRequired: "",
    gracePeriodDays: "",
    minCoveragePct: "",
  });
  const [mfaPolicyErrors, setMfaPolicyErrors] = useState<MfaPolicyErrors>({});
  const [mfaPolicyMessage, setMfaPolicyMessage] = useState("");
  const [localRateLimitRules, setLocalRateLimitRules] = useState<SecurityRateLimitRule[] | null>(
    null,
  );
  const [localHeaderPolicies, setLocalHeaderPolicies] = useState<SecurityHeaderPolicy[] | null>(
    null,
  );
  const [rateLimitSearch, setRateLimitSearch] = useState("");
  const [rateLimitStatusFilter, setRateLimitStatusFilter] =
    useState<PolicyStatusFilter>("all");
  const [rateLimitRiskFilter, setRateLimitRiskFilter] =
    useState<AuditSeverityFilter>("all");
  const [selectedRateLimitId, setSelectedRateLimitId] = useState<string | null>(null);
  const [selectedHeaderId, setSelectedHeaderId] = useState<string | null>(null);
  const [rateLimitForm, setRateLimitForm] = useState<RateLimitForm>({
    burst: "",
    limit: "",
    reason: "",
    windowSeconds: "",
  });
  const [rateLimitErrors, setRateLimitErrors] = useState<RateLimitErrors>({});
  const [rateLimitMessage, setRateLimitMessage] = useState("");

  const workspace = workspaceQuery.data?.data;
  const accessRules = workspace?.access_rules ?? emptyAccessRules;
  const auditEvents = workspace?.audit_events ?? emptyAuditEvents;
  const history = useMemo(
    () => localHistory ?? workspace?.change_history ?? emptyHistory,
    [localHistory, workspace?.change_history],
  );
  const matrix = workspace?.permission_matrix ?? emptyMatrix;
  const roles = workspace?.roles ?? emptyRoles;
  const assignments = useMemo(
    () => localAssignments ?? workspace?.role_assignments ?? emptyAssignments,
    [localAssignments, workspace?.role_assignments],
  );
  const assignRoleMutation = useMutation({
    mutationFn: assignSecurityRole,
    onError: (error) => {
      setAssignmentMessage(
        error instanceof Error ? error.message : "Не удалось назначить роль",
      );
    },
    onSuccess: ({ data }, request) => {
      setLocalAssignments(data.role_assignments);
      setAssignmentForm({ reason: "", role: "support", user: "" });
      setAssignmentErrors({});
      setAssignmentMessage(
        `Роль "${roleKeyLabel[request.role]}" для ${request.user} назначена`,
      );
    },
  });
  const workspaceSessions = workspace?.sessions ?? emptySessions;
  const sessions = useMemo(
    () => localSessions ?? workspaceSessions,
    [localSessions, workspaceSessions],
  );
  const visibleSessions = useMemo(() => uniqueLatestSessions(sessions), [sessions]);
  const sessionHistory = useMemo(
    () => localSessionHistory ?? workspace?.session_history ?? emptySessionHistory,
    [localSessionHistory, workspace?.session_history],
  );
  const terminateSessionMutation = useMutation({
    mutationFn: async (payload: { reason: string; session: AdminSession }) => {
      await terminateAdminSession(payload.session.id);
      return payload;
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось завершить сессию";
      setSessionMessage(message);
    },
    onSuccess: ({ reason, session: terminatedSession }) => {
      setLocalSessions((current) =>
        (current ?? sessions).map((session) =>
          session.id === terminatedSession.id ? { ...session, status: "terminated" } : session,
        ),
      );
      setLocalSessionHistory((current) => [
        {
          action: "Сессия завершена",
          actor: "Текущий админ",
          created_at: "Сейчас",
          id: `session-history-local-${sessionHistory.length + 1}`,
          reason,
          session_id: terminatedSession.id,
        },
        ...(current ?? sessionHistory),
      ]);
      setSessionForm({ reason: "" });
      setSessionErrors({});
      setSessionMessage(`Сессия ${terminatedSession.device} завершена`);
    },
  });
  const mfaUsers = workspace?.mfa_users ?? emptyMfaUsers;
  const mfaPolicy = localMfaPolicy ?? workspace?.mfa_policy ?? emptyMfaPolicy;
  const headerPolicies = useMemo(
    () => localHeaderPolicies ?? workspace?.header_policies ?? emptyHeaderPolicies,
    [localHeaderPolicies, workspace?.header_policies],
  );
  const rateLimitRules = useMemo(
    () => localRateLimitRules ?? workspace?.rate_limit_rules ?? emptyRateLimitRules,
    [localRateLimitRules, workspace?.rate_limit_rules],
  );
  const updatePoliciesMutation = useMutation({
    mutationFn: updateSecurityPolicies,
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Не удалось обновить политики";
      setMfaPolicyMessage(message);
      setRateLimitMessage(message);
    },
    onSuccess: async ({ data }) => {
      setLocalHeaderPolicies(data.header_policies);
      setLocalMfaPolicy(data.mfa_policy);
      setLocalRateLimitRules(data.rate_limit_rules);
      await workspaceQuery.refetch();
    },
  });
  const filteredRateLimitRules = useMemo(() => {
    const normalizedSearch = rateLimitSearch.trim().toLocaleLowerCase("ru-RU");

    return rateLimitRules
      .filter(
        (rule) => rateLimitStatusFilter === "all" || rule.status === rateLimitStatusFilter,
      )
      .filter((rule) => rateLimitRiskFilter === "all" || rule.risk === rateLimitRiskFilter)
      .filter((rule) =>
        normalizedSearch
          ? [rule.name, rule.endpoint, rule.owner]
              .join(" ")
              .toLocaleLowerCase("ru-RU")
              .includes(normalizedSearch)
          : true,
      );
  }, [rateLimitRiskFilter, rateLimitRules, rateLimitSearch, rateLimitStatusFilter]);
  const filteredMfaUsers = useMemo(() => {
    const normalizedSearch = mfaSearch.trim().toLocaleLowerCase("ru-RU");

    return mfaUsers
      .filter((user) => mfaStatusFilter === "all" || user.status === mfaStatusFilter)
      .filter((user) => mfaRiskFilter === "all" || user.risk === mfaRiskFilter)
      .filter((user) =>
        normalizedSearch
          ? [user.admin, roleKeyLabel[user.role], mfaFactorLabel[user.primary_factor]]
              .join(" ")
              .toLocaleLowerCase("ru-RU")
              .includes(normalizedSearch)
          : true,
      );
  }, [mfaRiskFilter, mfaSearch, mfaStatusFilter, mfaUsers]);
  const filteredSessions = useMemo(() => {
    const normalizedSearch = sessionSearch.trim().toLocaleLowerCase("ru-RU");

    return visibleSessions
      .filter((session) => sessionRiskFilter === "all" || session.risk === sessionRiskFilter)
      .filter(
        (session) =>
          sessionStatusFilter === "all" || session.status === sessionStatusFilter,
      )
      .filter((session) =>
        normalizedSearch
          ? [session.admin, session.device, session.ip, session.location]
              .join(" ")
              .toLocaleLowerCase("ru-RU")
              .includes(normalizedSearch)
          : true,
      );
  }, [visibleSessions, sessionRiskFilter, sessionSearch, sessionStatusFilter]);
  const filteredAuditEvents = useMemo(() => {
    const normalizedSearch = auditSearch.trim().toLocaleLowerCase("ru-RU");

    return auditEvents
      .filter((event) => auditFilter === "all" || event.severity === auditFilter)
      .filter((event) =>
        normalizedSearch
          ? [event.action, event.actor, event.target, event.evidence]
              .join(" ")
              .toLocaleLowerCase("ru-RU")
              .includes(normalizedSearch)
          : true,
      );
  }, [auditEvents, auditFilter, auditSearch]);
  const selectedAudit = useMemo(
    () =>
      filteredAuditEvents.find((event) => event.id === selectedAuditId) ??
      filteredAuditEvents[0] ??
      auditEvents[0],
    [auditEvents, filteredAuditEvents, selectedAuditId],
  );
  const selectedHistory = useMemo(
    () =>
      selectedAudit
        ? history.filter((entry) => entry.audit_event_id === selectedAudit.id)
        : [],
    [history, selectedAudit],
  );
  const selectedSession = useMemo(
    () =>
      filteredSessions.find((session) => session.id === selectedSessionId) ??
      filteredSessions[0] ??
      visibleSessions[0],
    [filteredSessions, visibleSessions, selectedSessionId],
  );
  const selectedSessionHistory = useMemo(
    () =>
      selectedSession
        ? sessionHistory.filter((entry) => entry.session_id === selectedSession.id)
        : [],
    [selectedSession, sessionHistory],
  );
  const selectedMfaUser = useMemo(
    () =>
      filteredMfaUsers.find((user) => user.id === selectedMfaUserId) ??
      filteredMfaUsers[0] ??
      mfaUsers[0],
    [filteredMfaUsers, mfaUsers, selectedMfaUserId],
  );
  const selectedRateLimit = useMemo(
    () =>
      filteredRateLimitRules.find((rule) => rule.id === selectedRateLimitId) ??
      filteredRateLimitRules[0] ??
      rateLimitRules[0],
    [filteredRateLimitRules, rateLimitRules, selectedRateLimitId],
  );
  const selectedHeader = useMemo(
    () =>
      headerPolicies.find((policy) => policy.id === selectedHeaderId) ?? headerPolicies[0],
    [headerPolicies, selectedHeaderId],
  );
  const activeSessions = visibleSessions.filter((session) => session.status === "active").length;
  const terminatedSessions = visibleSessions.filter((session) => session.status === "terminated").length;
  const collapsedSessionCount = Math.max(0, sessions.length - visibleSessions.length);
  const enabledMfaUsers = mfaUsers.filter((user) => user.status === "enabled").length;
  const pendingMfaUsers = mfaUsers.filter((user) => user.status === "pending").length;
  const privilegedMfaUsers = mfaUsers.filter((user) =>
    mfaPolicy.required_for_roles.includes(user.role),
  );
  const protectedPrivilegedUsers = privilegedMfaUsers.filter(
    (user) => user.status === "enabled",
  ).length;
  const activeRateLimitRules = rateLimitRules.filter((rule) => rule.status === "active").length;
  const reviewHeaders = headerPolicies.filter((policy) => policy.status === "review").length;
  const averageHeaderCoverage =
    headerPolicies.length > 0
      ? Math.round(
          headerPolicies.reduce((sum, policy) => sum + policy.coverage_pct, 0) /
            headerPolicies.length,
        )
      : 0;
  const pendingAccess = accessRules.filter((rule) => rule.status === "review").length;
  const activeAssignments = assignments.filter((assignment) => assignment.status === "active").length;

  function updateAssignmentForm<Key extends keyof AssignmentForm>(
    key: Key,
    value: AssignmentForm[Key],
  ) {
    setAssignmentForm((current) => ({ ...current, [key]: value }));
    setAssignmentErrors((current) => ({ ...current, [key]: undefined }));
    setAssignmentMessage("");
  }

  function updateHistoryForm<Key extends keyof HistoryForm>(
    key: Key,
    value: HistoryForm[Key],
  ) {
    setHistoryForm((current) => ({ ...current, [key]: value }));
    setHistoryErrors((current) => ({ ...current, [key]: undefined }));
    setHistoryMessage("");
  }

  function updateSessionForm<Key extends keyof SessionForm>(
    key: Key,
    value: SessionForm[Key],
  ) {
    setSessionForm((current) => ({ ...current, [key]: value }));
    setSessionErrors((current) => ({ ...current, [key]: undefined }));
    setSessionMessage("");
  }

  function updateMfaPolicyForm<Key extends keyof MfaPolicyForm>(
    key: Key,
    value: MfaPolicyForm[Key],
  ) {
    setMfaPolicyForm((current) => ({ ...current, [key]: value }));
    setMfaPolicyErrors((current) => ({ ...current, [key]: undefined }));
    setMfaPolicyMessage("");
  }

  function updateRateLimitForm<Key extends keyof RateLimitForm>(
    key: Key,
    value: RateLimitForm[Key],
  ) {
    setRateLimitForm((current) => ({ ...current, [key]: value }));
    setRateLimitErrors((current) => ({ ...current, [key]: undefined }));
    setRateLimitMessage("");
  }

  function patchSecurityPolicies(request: SecurityPoliciesPatchRequest) {
    updatePoliciesMutation.mutate(request);
  }

  function saveAssignment() {
    const parsed = assignmentSchema.safeParse(assignmentForm);

    if (!parsed.success) {
      const nextErrors: AssignmentErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof AssignmentForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setAssignmentErrors(nextErrors);
      setAssignmentMessage("");
      return;
    }

    setAssignmentMessage("");
    assignRoleMutation.mutate({
      reason: parsed.data.reason.trim(),
      role: parsed.data.role,
      user: parsed.data.user.trim(),
    });
  }

  function saveHistoryEntry() {
    const nextEventId = historyForm.auditEventId || selectedAudit?.id || "";
    const parsed = historySchema.safeParse({
      auditEventId: nextEventId,
      description: historyForm.description,
    });

    if (!parsed.success) {
      const nextErrors: HistoryErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof HistoryForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setHistoryErrors(nextErrors);
      setHistoryMessage("");
      return;
    }

    const entry: SecurityChangeHistory = {
      audit_event_id: parsed.data.auditEventId,
      author: "Елена Админ",
      created_at: "Сейчас",
      description: parsed.data.description.trim(),
      id: `history-local-${history.length + 1}`,
    };

    setLocalHistory((current) => [entry, ...(current ?? history)]);
    setHistoryForm({ auditEventId: parsed.data.auditEventId, description: "" });
    setHistoryErrors({});
    setHistoryMessage("Запись истории добавлена");
  }

  function terminateSelectedSession() {
    if (!selectedSession) {
      return;
    }

    const parsed = sessionSchema.safeParse(sessionForm);

    if (!parsed.success) {
      const nextErrors: SessionErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SessionForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setSessionErrors(nextErrors);
      setSessionMessage("");
      return;
    }

    setSessionErrors({});
    setSessionMessage("");
    terminateSessionMutation.mutate({
      reason: parsed.data.reason.trim(),
      session: selectedSession,
    });
  }

  function saveMfaPolicy() {
    const parsed = mfaPolicySchema.safeParse({
      backupCodesRequired:
        mfaPolicyForm.backupCodesRequired || String(mfaPolicy.backup_codes_required),
      gracePeriodDays: mfaPolicyForm.gracePeriodDays || String(mfaPolicy.grace_period_days),
      minCoveragePct: mfaPolicyForm.minCoveragePct || String(mfaPolicy.min_coverage_pct),
    });

    if (!parsed.success) {
      const nextErrors: MfaPolicyErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof MfaPolicyForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setMfaPolicyErrors(nextErrors);
      setMfaPolicyMessage("");
      return;
    }

    const updatedPolicy: SecurityMfaPolicy = {
      ...mfaPolicy,
      backup_codes_required: parsed.data.backupCodesRequired,
      grace_period_days: parsed.data.gracePeriodDays,
      min_coverage_pct: parsed.data.minCoveragePct,
      updated_at: "Сейчас",
    };

    setLocalMfaPolicy(updatedPolicy);
    setMfaPolicyForm({
      backupCodesRequired: String(parsed.data.backupCodesRequired),
      gracePeriodDays: String(parsed.data.gracePeriodDays),
      minCoveragePct: String(parsed.data.minCoveragePct),
    });
    setMfaPolicyErrors({});
    setMfaPolicyMessage("Политика 2FA/MFA обновлена");
    patchSecurityPolicies({ mfa_policy: updatedPolicy });
  }

  function saveRateLimitRule() {
    if (!selectedRateLimit) {
      return;
    }

    const parsed = rateLimitSchema.safeParse({
      burst: rateLimitForm.burst || String(selectedRateLimit.burst),
      limit: rateLimitForm.limit || String(selectedRateLimit.limit),
      reason: rateLimitForm.reason,
      windowSeconds: rateLimitForm.windowSeconds || String(selectedRateLimit.window_seconds),
    });

    if (!parsed.success) {
      const nextErrors: RateLimitErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof RateLimitForm | undefined;
        if (key) {
          nextErrors[key] = issue.message;
        }
      }
      setRateLimitErrors(nextErrors);
      setRateLimitMessage("");
      return;
    }

    const updatedRule: SecurityRateLimitRule = {
      ...selectedRateLimit,
      burst: parsed.data.burst,
      limit: parsed.data.limit,
      status: "review",
      updated_at: "Сейчас",
      window_seconds: parsed.data.windowSeconds,
    };

    const updatedRules = rateLimitRules.map((rule) =>
      rule.id === selectedRateLimit.id ? updatedRule : rule,
    );

    setLocalRateLimitRules(updatedRules);
    setRateLimitForm({
      burst: String(parsed.data.burst),
      limit: String(parsed.data.limit),
      reason: "",
      windowSeconds: String(parsed.data.windowSeconds),
    });
    setRateLimitErrors({});
    setRateLimitMessage(
      `Правило "${selectedRateLimit.name}" отправлено на проверку: ${parsed.data.reason.trim()}`,
    );
    patchSecurityPolicies({ rate_limit_rules: updatedRules });
  }

  function toggleSelectedHeaderPolicy() {
    if (!selectedHeader) {
      return;
    }

    const updatedHeader: SecurityHeaderPolicy = {
      ...selectedHeader,
      status: selectedHeader.status === "active" ? "review" : "active",
    };
    const updatedHeaders = headerPolicies.map((policy) =>
      policy.id === selectedHeader.id ? updatedHeader : policy,
    );

    setLocalHeaderPolicies(updatedHeaders);
    patchSecurityPolicies({ header_policies: updatedHeaders });
  }

  if (workspaceQuery.isPending) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <LoadingState label="Загрузка безопасности" />
      </main>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <ErrorState
          message="Данные безопасности временно недоступны. Повторите загрузку мок-данных."
          onRetry={() => void workspaceQuery.refetch()}
          title="Не удалось загрузить безопасность"
        />
      </main>
    );
  }

  if (
    !workspace ||
    (roles.length === 0 &&
      assignments.length === 0 &&
      matrix.length === 0 &&
      accessRules.length === 0 &&
      auditEvents.length === 0 &&
      history.length === 0 &&
      sessions.length === 0 &&
      sessionHistory.length === 0 &&
      mfaUsers.length === 0 &&
      rateLimitRules.length === 0 &&
      headerPolicies.length === 0)
  ) {
    return (
      <main className="px-4 py-6 lg:px-6">
        <section className="admin-panel p-6">
          <h1 className="text-[22px] font-bold tracking-normal text-white">Безопасность</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Роли, аудит и админские сессии пока не добавлены.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-disabled">
            Центр контроля доступа
          </p>
          <h1 className="mt-2 text-[22px] font-bold tracking-normal text-white">Безопасность</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Роли, матрица разрешений, журнал аудита и активные админские сессии SubHub Console.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md admin-gradient px-4 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
          onClick={() => setActiveTab("roles")}
          type="button"
        >
          <Plus aria-hidden="true" size={16} />
          Назначить роль
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">События аудита</p>
            <FileLock2 aria-hidden="true" className="text-brand-primary" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{auditEvents.length}</p>
          <p className="mt-2 text-sm text-text-secondary">За последние 24 часа</p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">Назначения ролей</p>
            <KeyRound aria-hidden="true" className="text-info" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{assignments.length}</p>
          <p className="mt-2 text-sm text-text-secondary">
            {activeAssignments} активных, {pendingAccess} на проверке
          </p>
        </article>
        <article className="admin-panel p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary">2FA</p>
            <ShieldCheck aria-hidden="true" className="text-success" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{workspace.mfa_coverage_pct}%</p>
          <p className="mt-2 text-sm text-text-secondary">Администраторов</p>
        </article>
        <article className="rounded-md border border-danger/30 bg-danger/10 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-danger">Сессии</p>
            <ShieldAlert aria-hidden="true" className="text-danger" size={18} />
          </div>
          <p className="mt-3 text-[22px] font-bold tracking-normal text-white">{activeSessions}</p>
          <p className="mt-2 text-sm text-text-secondary">Активные подключения</p>
        </article>
      </section>

      <section className="mt-6 admin-panel">
        <div className="flex flex-wrap gap-2 border-b border-white/10 p-4">
          {(Object.keys(tabLabel) as SecurityTab[]).map((tab) => (
            <button
              className={cn(
                "h-9 rounded-md border px-3 text-sm transition",
                activeTab === tab
                  ? "border-brand-primary bg-brand-primary/10 text-text-primary"
                  : "border-white/10 bg-bg-elevated text-text-secondary hover:text-white",
              )}
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {tabLabel[tab]}
            </button>
          ))}
        </div>

        {activeTab === "roles" ? (
          <div className="space-y-6 p-4">
            <section className="grid gap-3 lg:grid-cols-5">
              {roles.map((role) => (
                <article className="admin-panel-elevated p-4" key={role.id}>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-medium">{role.name}</h2>
                    <span className={cn("rounded-md px-2 py-1 text-xs", severityClass[role.risk])}>
                      {severityLabel[role.risk]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{role.description}</p>
                  <p className="mt-3 text-sm text-text-secondary">{role.users} пользователей</p>
                </article>
              ))}
            </section>

            <div className="grid gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
              <section className="admin-panel-elevated p-4">
                <h2 className="text-base font-semibold">Назначение роли</h2>
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Пользователь</span>
                    <input
                      aria-label="Пользователь"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateAssignmentForm("user", event.target.value)}
                      value={assignmentForm.user}
                    />
                    {assignmentErrors.user ? (
                      <span className="mt-1 block text-xs text-danger">
                        {assignmentErrors.user}
                      </span>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Роль</span>
                    <select
                      aria-label="Роль"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateAssignmentForm("role", event.target.value as SecurityRoleKey)
                      }
                      value={assignmentForm.role}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Причина доступа</span>
                    <input
                      aria-label="Причина доступа"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateAssignmentForm("reason", event.target.value)}
                      value={assignmentForm.reason}
                    />
                    {assignmentErrors.reason ? (
                      <span className="mt-1 block text-xs text-danger">
                        {assignmentErrors.reason}
                      </span>
                    ) : null}
                  </label>
                </div>
                <button
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                  disabled={assignRoleMutation.isPending}
                  onClick={saveAssignment}
                  type="button"
                >
                  <UserCheck aria-hidden="true" size={16} />
                  Сохранить роль
                </button>
                {assignmentMessage ? (
                  <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    {assignmentMessage}
                  </p>
                ) : null}
              </section>

              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                      <tr>
                        <th className="p-3" scope="col">Пользователь</th>
                        <th className="p-3" scope="col">Роль</th>
                        <th className="p-3" scope="col">Причина</th>
                        <th className="p-3" scope="col">Изменил</th>
                        <th className="p-3" scope="col">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment) => (
                        <tr className="border-t border-white/[0.06]" key={assignment.id}>
                          <td className="p-3 font-medium">{assignment.user}</td>
                          <td className="p-3">{roleKeyLabel[assignment.role]}</td>
                          <td className="p-3">{assignment.reason}</td>
                          <td className="p-3 text-text-secondary">{assignment.changed_by}</td>
                          <td className="p-3">
                            <span
                              className={cn(
                                "rounded-md px-2 py-1 text-xs",
                                accessStatusClass[assignment.status],
                              )}
                            >
                              {accessStatusLabel[assignment.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                      <tr>
                        <th className="p-3" scope="col">Область</th>
                        {roles.map((role) => (
                          <th className="p-3" key={role.id} scope="col">{role.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.map((row) => (
                        <tr className="border-t border-white/[0.06]" key={row.id}>
                          <td className="p-3 font-medium">{row.area}</td>
                          <td className="p-3">{permissionValue(row.owner)}</td>
                          <td className="p-3">{permissionValue(row.security)}</td>
                          <td className="p-3">{permissionValue(row.support)}</td>
                          <td className="p-3">{permissionValue(row.finance)}</td>
                          <td className="p-3">{permissionValue(row.analyst)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "audit" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <div className="grid gap-3 admin-panel-elevated p-4 md:grid-cols-[1fr_12rem]">
                <label className="block">
                  <span className="text-xs text-text-secondary">Поиск по аудиту</span>
                  <input
                    aria-label="Поиск по аудиту"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setAuditSearch(event.target.value)}
                    value={auditSearch}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Фильтр риска</span>
                  <select
                    aria-label="Фильтр риска"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setAuditFilter(event.target.value as AuditSeverityFilter)
                    }
                    value={auditFilter}
                  >
                    <option value="all">Все риски</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </label>
              </div>

              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead className="bg-bg-elevated text-xs uppercase tracking-[0.05em] text-text-disabled">
                    <tr>
                      <th className="p-3" scope="col">Событие</th>
                      <th className="p-3" scope="col">Автор</th>
                      <th className="p-3" scope="col">Цель</th>
                      <th className="p-3" scope="col">Риск</th>
                      <th className="p-3" scope="col">Время</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditEvents.map((event) => (
                      <tr
                        className={cn(
                          "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-elevated/70",
                          selectedAudit?.id === event.id ? "bg-bg-elevated" : "",
                        )}
                        key={event.id}
                        onClick={() => setSelectedAuditId(event.id)}
                      >
                        <td className="p-3 font-medium">{event.action}</td>
                        <td className="p-3">{event.actor}</td>
                        <td className="p-3">{event.target}</td>
                        <td className="p-3">
                          <span className={cn("rounded-md px-2 py-1 text-xs", severityClass[event.severity])}>
                            {severityLabel[event.severity]}
                          </span>
                        </td>
                        <td className="p-3 text-text-secondary">{event.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedAudit ? (
              <aside
                className="admin-panel-elevated p-4"
                data-testid="audit-detail-panel"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">{selectedAudit.action}</h2>
                  <Lock aria-hidden="true" className="text-brand-primary" size={18} />
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <p><span className="text-text-secondary">Автор:</span> {selectedAudit.actor}</p>
                  <p><span className="text-text-secondary">Цель:</span> {selectedAudit.target}</p>
                  <p><span className="text-text-secondary">IP:</span> {selectedAudit.ip}</p>
                  <p><span className="text-text-secondary">Время:</span> {selectedAudit.time}</p>
                </div>
                <p className="mt-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                  Доказательство: {selectedAudit.evidence}
                </p>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold">История изменений</h3>
                  <div className="mt-2 space-y-2">
                    {selectedHistory.map((entry) => (
                      <article className="rounded-lg bg-bg-card p-3 text-sm" key={entry.id}>
                        <p>{entry.description}</p>
                        <p className="mt-2 text-xs text-text-secondary">
                          {entry.author} - {entry.created_at}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Событие для истории</span>
                    <select
                      aria-label="Событие для истории"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateHistoryForm("auditEventId", event.target.value)}
                      value={historyForm.auditEventId || selectedAudit.id}
                    >
                      {auditEvents.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.action}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-3 block">
                    <span className="text-xs text-text-secondary">Описание изменения</span>
                    <input
                      aria-label="Описание изменения"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateHistoryForm("description", event.target.value)}
                      value={historyForm.description}
                    />
                    {historyErrors.description ? (
                      <span className="mt-1 block text-xs text-danger">
                        {historyErrors.description}
                      </span>
                    ) : null}
                  </label>
                  <button
                    className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                    onClick={saveHistoryEntry}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={16} />
                    Добавить запись истории
                  </button>
                  {historyMessage ? (
                    <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                      {historyMessage}
                    </p>
                  ) : null}
                </div>
              </aside>
            ) : null}
          </div>
        ) : null}

        {activeTab === "mfa" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Покрытие 2FA</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{workspace.mfa_coverage_pct}%</p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Защищены</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{enabledMfaUsers}</p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Ждут настройки</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{pendingMfaUsers}</p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Привилегированные</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">
                    {protectedPrivilegedUsers}/{privilegedMfaUsers.length}
                  </p>
                </article>
              </div>

              <div className="grid gap-3 admin-panel-elevated p-4 lg:grid-cols-[1fr_11rem_11rem]">
                <label className="block">
                  <span className="text-xs text-text-secondary">Поиск по 2FA</span>
                  <input
                    aria-label="Поиск по 2FA"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setMfaSearch(event.target.value)}
                    value={mfaSearch}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Статус 2FA</span>
                  <select
                    aria-label="Статус 2FA"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setMfaStatusFilter(event.target.value as MfaStatusFilter)
                    }
                    value={mfaStatusFilter}
                  >
                    <option value="all">Все статусы</option>
                    <option value="enabled">Включена</option>
                    <option value="pending">Ожидает настройки</option>
                    <option value="disabled">Отключена</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Риск 2FA</span>
                  <select
                    aria-label="Риск 2FA"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setMfaRiskFilter(event.target.value as AuditSeverityFilter)
                    }
                    value={mfaRiskFilter}
                  >
                    <option value="all">Все риски</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {filteredMfaUsers.map((user) => (
                  <article
                    className={cn(
                      "cursor-pointer rounded-md border p-4 transition",
                      selectedMfaUser?.id === user.id
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-white/10 bg-bg-elevated hover:border-white/20",
                    )}
                    key={user.id}
                    onClick={() => setSelectedMfaUserId(user.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-medium">{user.admin}</h2>
                        <p className="mt-1 text-sm text-text-secondary">
                          {roleKeyLabel[user.role]} - {mfaFactorLabel[user.primary_factor]}
                        </p>
                      </div>
                      <ShieldCheck aria-hidden="true" className="text-brand-primary" size={18} />
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className={cn("rounded-md px-2 py-1 text-xs", mfaStatusClass[user.status])}>
                        {mfaStatusLabel[user.status]}
                      </span>
                      <span className={cn("rounded-md px-2 py-1 text-xs", severityClass[user.risk])}>
                        {severityLabel[user.risk]}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {filteredMfaUsers.length === 0 ? (
                <div className="admin-panel-elevated p-4 text-sm text-text-secondary">
                  Администраторы по выбранным фильтрам 2FA не найдены.
                </div>
              ) : null}
            </div>

            <aside className="admin-panel-elevated p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Управление 2FA/MFA</h2>
                <ShieldCheck aria-hidden="true" className="text-success" size={18} />
              </div>
              {selectedMfaUser ? (
                <>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-text-secondary">Администратор:</span> {selectedMfaUser.admin}</p>
                    <p><span className="text-text-secondary">Роль:</span> {roleKeyLabel[selectedMfaUser.role]}</p>
                    <p><span className="text-text-secondary">Фактор:</span> {mfaFactorLabel[selectedMfaUser.primary_factor]}</p>
                    <p><span className="text-text-secondary">Статус:</span> {mfaStatusLabel[selectedMfaUser.status]}</p>
                    <p><span className="text-text-secondary">Последняя проверка:</span> {selectedMfaUser.last_challenge_at}</p>
                    <p><span className="text-text-secondary">Резервные коды:</span> {selectedMfaUser.backup_codes_left}</p>
                    <p><span className="text-text-secondary">Доверенные устройства:</span> {selectedMfaUser.trusted_devices}</p>
                  </div>
                  <p className="mt-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                    Рекомендация: {selectedMfaUser.recommendation}
                  </p>
                </>
              ) : null}

              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <h3 className="text-sm font-semibold">Политика MFA</h3>
                <p className="mt-2 text-xs text-text-secondary">
                  Обязательные роли: {mfaPolicy.required_for_roles.map((role) => roleKeyLabel[role]).join(", ")}
                </p>
                <div className="mt-3 space-y-3">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Минимальное покрытие, %</span>
                    <input
                      aria-label="Минимальное покрытие MFA"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateMfaPolicyForm("minCoveragePct", event.target.value)}
                      value={mfaPolicyForm.minCoveragePct || String(mfaPolicy.min_coverage_pct)}
                    />
                    {mfaPolicyErrors.minCoveragePct ? (
                      <span className="mt-1 block text-xs text-danger">
                        {mfaPolicyErrors.minCoveragePct}
                      </span>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Льготный период, дней</span>
                    <input
                      aria-label="Льготный период MFA"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => updateMfaPolicyForm("gracePeriodDays", event.target.value)}
                      value={mfaPolicyForm.gracePeriodDays || String(mfaPolicy.grace_period_days)}
                    />
                    {mfaPolicyErrors.gracePeriodDays ? (
                      <span className="mt-1 block text-xs text-danger">
                        {mfaPolicyErrors.gracePeriodDays}
                      </span>
                    ) : null}
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Резервные коды</span>
                    <input
                      aria-label="Резервные коды MFA"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        updateMfaPolicyForm("backupCodesRequired", event.target.value)
                      }
                      value={
                        mfaPolicyForm.backupCodesRequired ||
                        String(mfaPolicy.backup_codes_required)
                      }
                    />
                    {mfaPolicyErrors.backupCodesRequired ? (
                      <span className="mt-1 block text-xs text-danger">
                        {mfaPolicyErrors.backupCodesRequired}
                      </span>
                    ) : null}
                  </label>
                </div>
                <button
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                  onClick={saveMfaPolicy}
                  type="button"
                >
                  <ShieldCheck aria-hidden="true" size={16} />
                  Сохранить политику MFA
                </button>
                {mfaPolicyMessage ? (
                  <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    {mfaPolicyMessage}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}

        {activeTab === "policies" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Активные лимиты</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{activeRateLimitRules}</p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Покрытие заголовков</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{averageHeaderCoverage}%</p>
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">На проверке</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{reviewHeaders}</p>
                </article>
              </div>

              <section className="admin-panel-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">API rate limiting</h2>
                  <ShieldAlert aria-hidden="true" className="text-warning" size={18} />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_11rem_11rem]">
                  <label className="block">
                    <span className="text-xs text-text-secondary">Поиск по лимитам</span>
                    <input
                      aria-label="Поиск по лимитам"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) => setRateLimitSearch(event.target.value)}
                      value={rateLimitSearch}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Статус лимита</span>
                    <select
                      aria-label="Статус лимита"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        setRateLimitStatusFilter(event.target.value as PolicyStatusFilter)
                      }
                      value={rateLimitStatusFilter}
                    >
                      <option value="all">Все статусы</option>
                      <option value="active">Активные</option>
                      <option value="review">На проверке</option>
                      <option value="disabled">Отключённые</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-text-secondary">Риск лимита</span>
                    <select
                      aria-label="Риск лимита"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      onChange={(event) =>
                        setRateLimitRiskFilter(event.target.value as AuditSeverityFilter)
                      }
                      value={rateLimitRiskFilter}
                    >
                      <option value="all">Все риски</option>
                      <option value="high">Высокий</option>
                      <option value="medium">Средний</option>
                      <option value="low">Низкий</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 overflow-x-auto rounded-lg border border-white/[0.06]">
                  <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                    <thead className="bg-bg-card text-text-secondary">
                      <tr>
                        <th className="p-3" scope="col">Правило</th>
                        <th className="p-3" scope="col">Маршрут</th>
                        <th className="p-3" scope="col">Лимит</th>
                        <th className="p-3" scope="col">Статус</th>
                        <th className="p-3" scope="col">Риск</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRateLimitRules.map((rule) => (
                        <tr
                          className={cn(
                            "cursor-pointer border-t border-white/[0.06] transition hover:bg-bg-card",
                            selectedRateLimit?.id === rule.id ? "bg-bg-card" : "",
                          )}
                          key={rule.id}
                          onClick={() => setSelectedRateLimitId(rule.id)}
                        >
                          <td className="p-3 font-medium">{rule.name}</td>
                          <td className="p-3 text-text-secondary">{rule.endpoint}</td>
                          <td className="p-3">{rule.limit}/{rule.window_seconds} сек.</td>
                          <td className="p-3">
                            <span className={cn("rounded-md px-2 py-1 text-xs", policyStatusClass[rule.status])}>
                              {policyStatusLabel[rule.status]}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={cn("rounded-md px-2 py-1 text-xs", severityClass[rule.risk])}>
                              {severityLabel[rule.risk]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredRateLimitRules.length === 0 ? (
                  <div className="mt-4 admin-panel p-4 text-sm text-text-secondary">
                    Правила лимитов по выбранным фильтрам не найдены.
                  </div>
                ) : null}
              </section>

              <section className="admin-panel-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">Заголовки безопасности</h2>
                  <Lock aria-hidden="true" className="text-success" size={18} />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {headerPolicies.map((policy) => (
                    <article
                      className={cn(
                        "cursor-pointer rounded-md border p-4 transition",
                        selectedHeader?.id === policy.id
                          ? "border-brand-primary bg-brand-primary/10"
                          : "border-white/10 bg-bg-card hover:border-white/20",
                      )}
                      key={policy.id}
                      onClick={() => setSelectedHeaderId(policy.id)}
                    >
                      <h3 className="font-medium">{policy.header}</h3>
                      <p className="mt-2 text-sm text-text-secondary">
                        Покрытие: {policy.coverage_pct}%
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className={cn("rounded-md px-2 py-1 text-xs", policyStatusClass[policy.status])}>
                          {policyStatusLabel[policy.status]}
                        </span>
                        <span className={cn("rounded-md px-2 py-1 text-xs", severityClass[policy.risk])}>
                          {severityLabel[policy.risk]}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="admin-panel-elevated p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Настройка политик</h2>
                <FileLock2 aria-hidden="true" className="text-brand-primary" size={18} />
              </div>

              {selectedRateLimit ? (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold">Выбранный лимит</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-text-secondary">Правило:</span> {selectedRateLimit.name}</p>
                    <p><span className="text-text-secondary">Маршрут:</span> {selectedRateLimit.endpoint}</p>
                    <p><span className="text-text-secondary">Владелец:</span> {selectedRateLimit.owner}</p>
                    <p><span className="text-text-secondary">Обновлено:</span> {selectedRateLimit.updated_at}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="block">
                      <span className="text-xs text-text-secondary">Лимит запросов</span>
                      <input
                        aria-label="Лимит запросов"
                        className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                        onChange={(event) => updateRateLimitForm("limit", event.target.value)}
                        value={rateLimitForm.limit || String(selectedRateLimit.limit)}
                      />
                      {rateLimitErrors.limit ? (
                        <span className="mt-1 block text-xs text-danger">
                          {rateLimitErrors.limit}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="text-xs text-text-secondary">Окно, секунд</span>
                      <input
                        aria-label="Окно лимита"
                        className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                        onChange={(event) =>
                          updateRateLimitForm("windowSeconds", event.target.value)
                        }
                        value={
                          rateLimitForm.windowSeconds ||
                          String(selectedRateLimit.window_seconds)
                        }
                      />
                      {rateLimitErrors.windowSeconds ? (
                        <span className="mt-1 block text-xs text-danger">
                          {rateLimitErrors.windowSeconds}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="text-xs text-text-secondary">Burst</span>
                      <input
                        aria-label="Burst лимита"
                        className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                        onChange={(event) => updateRateLimitForm("burst", event.target.value)}
                        value={rateLimitForm.burst || String(selectedRateLimit.burst)}
                      />
                      {rateLimitErrors.burst ? (
                        <span className="mt-1 block text-xs text-danger">
                          {rateLimitErrors.burst}
                        </span>
                      ) : null}
                    </label>
                    <label className="block">
                      <span className="text-xs text-text-secondary">Причина изменения</span>
                      <input
                        aria-label="Причина изменения лимита"
                        className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                        onChange={(event) => updateRateLimitForm("reason", event.target.value)}
                        value={rateLimitForm.reason}
                      />
                      {rateLimitErrors.reason ? (
                        <span className="mt-1 block text-xs text-danger">
                          {rateLimitErrors.reason}
                        </span>
                      ) : null}
                    </label>
                  </div>
                  <button
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md admin-gradient px-3 text-sm font-medium text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5"
                    onClick={saveRateLimitRule}
                    type="button"
                  >
                    <ShieldAlert aria-hidden="true" size={16} />
                    Сохранить лимит
                  </button>
                  {rateLimitMessage ? (
                    <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                      {rateLimitMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {selectedHeader ? (
                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <h3 className="text-sm font-semibold">Выбранный заголовок</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-text-secondary">Заголовок:</span> {selectedHeader.header}</p>
                    <p><span className="text-text-secondary">Значение:</span> {selectedHeader.value}</p>
                    <p><span className="text-text-secondary">Покрытие:</span> {selectedHeader.coverage_pct}%</p>
                  </div>
                  <p className="mt-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                    Рекомендация: {selectedHeader.recommendation}
                  </p>
                  <button
                    className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md admin-panel text-sm text-text-secondary transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={updatePoliciesMutation.isPending}
                    onClick={toggleSelectedHeaderPolicy}
                    type="button"
                  >
                    {selectedHeader.status === "active" ? "Отправить на проверку" : "Активировать"}
                  </button>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}

        {activeTab === "sessions" ? (
          <div className="grid gap-6 p-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <div className="grid gap-3 admin-panel-elevated p-4 lg:grid-cols-[1fr_11rem_11rem]">
                <label className="block">
                  <span className="text-xs text-text-secondary">Поиск по сессиям</span>
                  <input
                    aria-label="Поиск по сессиям"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) => setSessionSearch(event.target.value)}
                    value={sessionSearch}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Риск сессии</span>
                  <select
                    aria-label="Риск сессии"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setSessionRiskFilter(event.target.value as SessionRiskFilter)
                    }
                    value={sessionRiskFilter}
                  >
                    <option value="all">Все риски</option>
                    <option value="high">Высокий</option>
                    <option value="medium">Средний</option>
                    <option value="low">Низкий</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-text-secondary">Статус сессии</span>
                  <select
                    aria-label="Статус сессии"
                    className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                    onChange={(event) =>
                      setSessionStatusFilter(event.target.value as SessionStatusFilter)
                    }
                    value={sessionStatusFilter}
                  >
                    <option value="all">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="terminated">Завершённые</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Активные сессии</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{activeSessions}</p>
                  {collapsedSessionCount > 0 ? (
                    <p className="mt-1 text-xs text-text-secondary">
                      Скрыто дублей backend: {collapsedSessionCount}
                    </p>
                  ) : null}
                </article>
                <article className="admin-panel-elevated p-4">
                  <p className="text-sm text-text-secondary">Завершённые сессии</p>
                  <p className="mt-2 text-[22px] font-bold tracking-normal text-white">{terminatedSessions}</p>
                </article>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {filteredSessions.map((session) => (
                  <article
                    className={cn(
                      "cursor-pointer rounded-md border p-4 transition",
                      selectedSession?.id === session.id
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-white/10 bg-bg-elevated hover:border-white/20",
                      session.status === "terminated" ? "opacity-60" : "",
                    )}
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-medium">{session.device}</h2>
                        <p className="mt-1 text-sm text-text-secondary">{session.admin}</p>
                      </div>
                      <Laptop aria-hidden="true" className="text-brand-primary" size={18} />
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-text-secondary">
                      <p>{session.ip}</p>
                      <p>{session.location}</p>
                      <p className="inline-flex items-center gap-2">
                        <Clock aria-hidden="true" size={14} />
                        {formatSessionTime(session.last_seen)}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className={cn("rounded-md px-2 py-1 text-xs", severityClass[session.risk])}>
                        {severityLabel[session.risk]}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {session.status === "active" ? "Активна" : "Завершена"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {filteredSessions.length === 0 ? (
                <div className="admin-panel-elevated p-4 text-sm text-text-secondary">
                  Сессии по выбранным фильтрам не найдены.
                </div>
              ) : null}
            </div>

            <aside className="admin-panel-elevated p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">Управление сессией</h2>
                <ShieldAlert aria-hidden="true" className="text-danger" size={18} />
              </div>
              {selectedSession ? (
                <>
                  <div className="mt-3 space-y-2 text-sm">
                    <p><span className="text-text-secondary">Администратор:</span> {selectedSession.admin}</p>
                    <p><span className="text-text-secondary">Устройство:</span> {selectedSession.device}</p>
                    <p><span className="text-text-secondary">IP:</span> {selectedSession.ip}</p>
                    <p><span className="text-text-secondary">Локация:</span> {selectedSession.location}</p>
                    <p><span className="text-text-secondary">Активность:</span> {formatSessionTime(selectedSession.last_seen)}</p>
                    <p>
                      <span className="text-text-secondary">Статус:</span>{" "}
                      {selectedSession.status === "active" ? "Активна" : "Завершена"}
                    </p>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold">История сессии</h3>
                    <div className="mt-2 space-y-2">
                      {selectedSessionHistory.map((entry) => (
                        <article className="rounded-lg bg-bg-card p-3 text-sm" key={entry.id}>
                          <p className="font-medium">{entry.action}</p>
                          <p className="mt-1 text-text-secondary">{entry.reason}</p>
                          <p className="mt-2 text-xs text-text-secondary">
                            {entry.actor} - {entry.created_at}
                          </p>
                        </article>
                      ))}
                    </div>
                  </div>
                  <label className="mt-4 block">
                    <span className="text-xs text-text-secondary">Причина завершения</span>
                    <input
                      aria-label="Причина завершения"
                      className="mt-1 h-10 w-full admin-panel px-3 text-sm outline-none focus:border-brand-primary"
                      disabled={selectedSession.status === "terminated"}
                      onChange={(event) => updateSessionForm("reason", event.target.value)}
                      value={sessionForm.reason}
                    />
                    {sessionErrors.reason ? (
                      <span className="mt-1 block text-xs text-danger">
                        {sessionErrors.reason}
                      </span>
                    ) : null}
                  </label>
                  <button
                    className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-danger px-3 text-sm font-medium text-white transition hover:bg-danger/80 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      selectedSession.status === "terminated" || terminateSessionMutation.isPending
                    }
                    onClick={terminateSelectedSession}
                    type="button"
                  >
                    <LogOut aria-hidden="true" size={16} />
                    Завершить сессию
                  </button>
                </>
              ) : null}
              {sessionMessage ? (
                <p className="mt-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {sessionMessage}
                </p>
              ) : null}
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
