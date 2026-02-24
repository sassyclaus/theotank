export interface AdminUser {
  id: string;
  email: string;
  name: string;
  tier: "free" | "base" | "pro" | "scholar";
  submissionsUsed: number;
  submissionsLimit: number;
  signupDate: string;
  status: "active" | "suspended" | "churned";
  lastActive: string;
  source: string;
  stripeId?: string;
  exploreUnlocks: number;
  researchQueries: number;
  sharedResults: number;
  customTeams: number;
  billingCycle?: string;
  paymentStatus?: string;
}

export interface UserSubmission {
  id: string;
  date: string;
  tool: "ask" | "poll" | "review" | "research";
  query: string;
  team: string;
  status: "complete" | "processing" | "failed";
  isPublic: boolean;
}

export interface UserActivityEntry {
  id: string;
  timestamp: string;
  action: string;
}

export interface AdminNote {
  id: string;
  author: string;
  date: string;
  content: string;
}

export const mockUsers: AdminUser[] = [
  {
    id: "usr_01",
    email: "marcus.chen@gmail.com",
    name: "Marcus Chen",
    tier: "pro",
    submissionsUsed: 34,
    submissionsLimit: 50,
    signupDate: "2026-01-05",
    status: "active",
    lastActive: "2026-02-23",
    source: "organic",
    stripeId: "cus_R1kXm9q2Lp",
    exploreUnlocks: 12,
    researchQueries: 8,
    sharedResults: 5,
    customTeams: 3,
    billingCycle: "monthly",
    paymentStatus: "current",
  },
  {
    id: "usr_02",
    email: "priya.nair@outlook.com",
    name: "Priya Nair",
    tier: "base",
    submissionsUsed: 20,
    submissionsLimit: 20,
    signupDate: "2026-01-12",
    status: "active",
    lastActive: "2026-02-22",
    source: "referral",
    stripeId: "cus_R2bYn8r3Mp",
    exploreUnlocks: 6,
    researchQueries: 0,
    sharedResults: 2,
    customTeams: 0,
    billingCycle: "monthly",
    paymentStatus: "current",
  },
  {
    id: "usr_03",
    email: "daniel.foster@proton.me",
    name: "Daniel Foster",
    tier: "free",
    submissionsUsed: 3,
    submissionsLimit: 5,
    signupDate: "2026-02-01",
    status: "active",
    lastActive: "2026-02-20",
    source: "twitter",
    exploreUnlocks: 1,
    researchQueries: 0,
    sharedResults: 0,
    customTeams: 0,
  },
  {
    id: "usr_04",
    email: "sarah.kim@seminary.edu",
    name: "Sarah Kim",
    tier: "scholar",
    submissionsUsed: 78,
    submissionsLimit: 200,
    signupDate: "2026-01-08",
    status: "active",
    lastActive: "2026-02-23",
    source: "partner_seminary",
    stripeId: "cus_R4dZo7t5Nr",
    exploreUnlocks: 45,
    researchQueries: 31,
    sharedResults: 18,
    customTeams: 7,
    billingCycle: "annual",
    paymentStatus: "current",
  },
  {
    id: "usr_05",
    email: "james.okafor@yahoo.com",
    name: "James Okafor",
    tier: "base",
    submissionsUsed: 11,
    submissionsLimit: 20,
    signupDate: "2026-01-22",
    status: "suspended",
    lastActive: "2026-02-10",
    source: "organic",
    stripeId: "cus_R5eAp6u6Os",
    exploreUnlocks: 4,
    researchQueries: 0,
    sharedResults: 1,
    customTeams: 1,
    billingCycle: "monthly",
    paymentStatus: "failed",
  },
  {
    id: "usr_06",
    email: "emily.ross@icloud.com",
    name: "Emily Ross",
    tier: "pro",
    submissionsUsed: 42,
    submissionsLimit: 50,
    signupDate: "2026-01-15",
    status: "active",
    lastActive: "2026-02-21",
    source: "podcast",
    stripeId: "cus_R6fBq5v7Pt",
    exploreUnlocks: 19,
    researchQueries: 14,
    sharedResults: 9,
    customTeams: 2,
    billingCycle: "monthly",
    paymentStatus: "current",
  },
  {
    id: "usr_07",
    email: "ben.hartley@gmail.com",
    name: "Ben Hartley",
    tier: "free",
    submissionsUsed: 5,
    submissionsLimit: 5,
    signupDate: "2026-02-14",
    status: "churned",
    lastActive: "2026-02-16",
    source: "organic",
    exploreUnlocks: 0,
    researchQueries: 0,
    sharedResults: 0,
    customTeams: 0,
  },
  {
    id: "usr_08",
    email: "grace.liu@fastmail.com",
    name: "Grace Liu",
    tier: "base",
    submissionsUsed: 7,
    submissionsLimit: 20,
    signupDate: "2026-02-08",
    status: "active",
    lastActive: "2026-02-22",
    source: "newsletter",
    stripeId: "cus_R8hDr3x9Rv",
    exploreUnlocks: 3,
    researchQueries: 0,
    sharedResults: 1,
    customTeams: 0,
    billingCycle: "monthly",
    paymentStatus: "current",
  },
];

export const mockUserSubmissions: UserSubmission[] = [
  {
    id: "sub_01",
    date: "2026-02-23",
    tool: "ask",
    query: "What is Barth's view on natural theology?",
    team: "Reformed Theologians",
    status: "complete",
    isPublic: true,
  },
  {
    id: "sub_02",
    date: "2026-02-21",
    tool: "poll",
    query: "Is universal reconciliation biblically defensible?",
    team: "Early Church Fathers",
    status: "complete",
    isPublic: false,
  },
  {
    id: "sub_03",
    date: "2026-02-19",
    tool: "review",
    query: "Evaluate MacIntyre's critique of emotivism",
    team: "Catholic Moral Theologians",
    status: "complete",
    isPublic: true,
  },
  {
    id: "sub_04",
    date: "2026-02-17",
    tool: "research",
    query: "Pneumatology in Moltmann vs. Pannenberg",
    team: "Systematic Theology Panel",
    status: "complete",
    isPublic: false,
  },
  {
    id: "sub_05",
    date: "2026-02-15",
    tool: "ask",
    query: "How does Aquinas define the beatific vision?",
    team: "Thomistic Scholars",
    status: "failed",
    isPublic: false,
  },
  {
    id: "sub_06",
    date: "2026-02-14",
    tool: "poll",
    query: "Should churches ordain women to pastoral ministry?",
    team: "Ecumenical Council",
    status: "processing",
    isPublic: false,
  },
];

export const mockUserActivity: UserActivityEntry[] = [
  {
    id: "act_01",
    timestamp: "2026-02-23T14:32:07Z",
    action: "Submitted Ask query to Reformed Theologians",
  },
  {
    id: "act_02",
    timestamp: "2026-02-23T14:05:22Z",
    action: "Unlocked Explore result: Christology debate",
  },
  {
    id: "act_03",
    timestamp: "2026-02-22T18:41:55Z",
    action: "Created custom team: Systematic Theology Panel",
  },
  {
    id: "act_04",
    timestamp: "2026-02-21T09:12:30Z",
    action: "Shared Poll result publicly",
  },
  {
    id: "act_05",
    timestamp: "2026-02-20T16:55:11Z",
    action: "Upgraded tier from Base to Pro",
  },
];

export const mockAdminNotes: AdminNote[] = [
  {
    id: "note_01",
    author: "sarah@theotank.com",
    date: "2026-02-18",
    content:
      "User reached out via support email asking about Scholar tier pricing for seminary group license. Sent pricing sheet and scheduled follow-up for 2/25.",
  },
  {
    id: "note_02",
    author: "jordan@theotank.com",
    date: "2026-02-10",
    content:
      "Beta tester from early access cohort. Gave feedback on Poll response quality — flagged for product review.",
  },
];
