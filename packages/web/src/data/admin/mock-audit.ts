// ── Types ──────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  target: string;
  before?: string;
  after?: string;
  reason?: string;
}

// ── Mock Audit Log ─────────────────────────────────────────────────

export const mockAuditLog: AuditEntry[] = [
  {
    id: "audit-1",
    timestamp: "2026-02-18T14:32:07Z",
    admin: "sarah@theotank.com",
    action: "user.tier_change",
    target: "user:4827",
    before: "base",
    after: "pro",
    reason: "Beta tester upgrade",
  },
  {
    id: "audit-2",
    timestamp: "2026-02-18T13:15:22Z",
    admin: "david@theotank.com",
    action: "content.approve",
    target: "result:8921",
    reason: "Legitimate theological inquiry",
  },
  {
    id: "audit-3",
    timestamp: "2026-02-17T16:44:01Z",
    admin: "sarah@theotank.com",
    action: "user.bonus_credits",
    target: "user:3312",
    after: "+10 credits",
    reason: "Welcome gift",
  },
  {
    id: "audit-4",
    timestamp: "2026-02-17T11:20:33Z",
    admin: "david@theotank.com",
    action: "theologian.bio_update",
    target: "theologian:aquinas",
  },
  {
    id: "audit-5",
    timestamp: "2026-02-16T09:55:18Z",
    admin: "sarah@theotank.com",
    action: "content.remove",
    target: "result:7654",
    reason: "Spam content",
  },
  {
    id: "audit-6",
    timestamp: "2026-02-16T08:30:45Z",
    admin: "david@theotank.com",
    action: "feature_flag.toggle",
    target: "calvin_corpus",
    before: "OFF",
    after: "ON",
  },
  {
    id: "audit-7",
    timestamp: "2026-02-15T17:12:09Z",
    admin: "sarah@theotank.com",
    action: "user.suspend",
    target: "user:1923",
    reason: "Terms of service violation",
  },
  {
    id: "audit-8",
    timestamp: "2026-02-15T14:45:33Z",
    admin: "david@theotank.com",
    action: "team.reorder",
    target: "native_teams",
    before: "1,2,3,4",
    after: "2,1,3,4",
  },
  {
    id: "audit-9",
    timestamp: "2026-02-14T10:22:17Z",
    admin: "sarah@theotank.com",
    action: "collection.publish",
    target: "collection:atonement",
    before: "draft",
    after: "live",
  },
  {
    id: "audit-10",
    timestamp: "2026-02-14T09:01:44Z",
    admin: "david@theotank.com",
    action: "corpus.status_change",
    target: "corpus:calvin",
    before: "processing",
    after: "live",
  },
];
