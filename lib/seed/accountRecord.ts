export type { ScopeMode } from "../seed";

export type AccountNote = {
  date: string;
  author: string;
  kind: "call" | "discovery" | "note" | "email";
  text: string;
  partial?: boolean;
};

export type AccountRecord = {
  account: {
    name: string;
    industry: string;
    revenue: string;
  };
  notes: AccountNote[];
  opportunity: {
    name: string;
    stage: string;
    value: number;
    closeDatePushes: number;
    weeksSinceUpdate: number;
  };
  contacts: Array<{
    name: string;
    role: string;
    relationship?: string;
    economicBuyer?: boolean;
    activityLogged: boolean;
  }>;
  partnerProfile: {
    partner: string;
    fundingHistory: string;
    registeredDeals: number;
  };
};

export const prmBadge = "From PRM · Salesforce";

export function crmBadge(partnerName: string) {
  return `From CRM · ${partnerName}`;
}

export const heartlandAccountRecord: AccountRecord = {
  account: {
    name: "Heartland Mutual Insurance",
    industry: "Insurance",
    revenue: "$900M revenue",
  },
  notes: [
    {
      date: "14 Jan",
      author: "Jenna Kowalski",
      kind: "call",
      text: 'Dana Reyes raised board pressure on AI. Claims intake is the pain; she used the word "drowning." No budget identified. Asked us to come back with options.',
    },
    {
      date: "22 Jan",
      author: "Ravi Menon",
      kind: "discovery",
      text: "Document-heavy intake, PDF claim forms, ~200 person team. Six-day cycle to first decision. Dana said they covered Q1 volume with overtime rather than hiring.",
    },
    {
      date: "29 Jan",
      author: "Ravi Menon",
      kind: "note",
      text: "Flagged compliance early. Robert Osei will need an audit trail on anything automated. Need to confirm whether the low-confidence...",
      partial: true,
    },
  ],
  opportunity: {
    name: "Heartland Mutual — AI claims modernisation",
    stage: "Stage 2",
    value: 2_100_000,
    closeDatePushes: 2,
    weeksSinceUpdate: 6,
  },
  contacts: [
    {
      name: "Dana Reyes",
      role: "VP Claims Operations",
      relationship: "Champion",
      activityLogged: true,
    },
    {
      name: "Michelle Dorsey",
      role: "Claims Supervisor",
      activityLogged: true,
    },
    {
      name: "Alex Chen",
      role: "Senior Developer",
      activityLogged: true,
    },
    {
      name: "Robert Osei",
      role: "Compliance",
      activityLogged: true,
    },
    {
      name: "Sandeep Nair",
      role: "Infrastructure",
      activityLogged: true,
    },
    {
      name: "Karen Whitfield",
      role: "CFO",
      relationship: "Economic buyer",
      economicBuyer: true,
      activityLogged: false,
    },
  ],
  partnerProfile: {
    partner: "CDW",
    fundingHistory: "Two prior funded pilots",
    registeredDeals: 1,
  },
};

export function deriveKarenObservation(record: AccountRecord | null) {
  if (!record) return null;
  const buyer = record.contacts.find((contact) => contact.economicBuyer);
  if (!buyer || buyer.activityLogged || record.opportunity.closeDatePushes < 2) {
    return null;
  }
  return `${buyer.name}, the economic buyer, has no logged activity. The close date has slipped twice. Those facts are likely related; invite her or brief Dana to carry the funding ask.`;
}
