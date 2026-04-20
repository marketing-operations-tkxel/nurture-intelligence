// Mock data for Phase 1 development — replaced by real SF/Pardot data post Phase 0

export const mockExecutiveKPIs = {
  period: 'Apr 1 – Apr 18, 2026',
  prevPeriod: 'Mar 1 – Mar 31, 2026',

  // Email health
  emailsSent: 142_800,
  emailsSentChange: 8.4,
  deliveryRate: 96.2,
  deliveryRateChange: 0.3,
  bounceRate: 3.8,
  bounceRateChange: -0.3,
  uniqueOpenRate: 24.7,
  uniqueOpenRateChange: 2.1,
  uniqueClickRate: 4.3,
  uniqueClickRateChange: -0.8,
  unsubscribeRate: 0.4,
  unsubscribeRateChange: 0.1,
  spamRate: 0.08,
  spamRateChange: -0.01,

  // Raw counts
  opensCount: 35_262,
  clicksCount: 6_140,
  unsubscribesCount: 571,
  bouncesCount: 5_426,
  spamCount: 114,
  prospectsAddedToNurture: 8_420,
  prospectsOpenedAny: 14_820,
  prospectsClickedAny: 6_140,
  prospectsNoEngagement: 12_940,
  prospectsOpenedAnyChange: 5.7,
  prospectsClickedAnyChange: -2.8,
  prospectsNoEngagementChange: 4.4,
  avgSalesCycleDays: 67,

  // Audience
  totalAudience: 38_450,
  totalAudienceChange: 3.2,
  engagedAudience: 14_820,
  engagedAudienceChange: 5.7,
  engagedRate: 38.5,

  // Funnel
  mqls: 312,
  mqlsChange: 11.4,
  sqls: 187,
  sqlsChange: 6.8,
  discoveryCalls: 94,
  discoveryCallsChange: 14.6,
  opportunities: 61,
  opportunitiesChange: 8.9,
  wonOpportunities: 18,
  wonOpportunitiesChange: 28.6,
  pipelineValue: 2_840_000,
  pipelineValueChange: 12.3,
  wonRevenue: 540_000,
  wonRevenueChange: 28.6,
}

export const mockTopSequences = [
  { name: 'SaaS Mid-Market Nurture v3', mqlRate: 18.4, sqlRate: 11.2, wonRevenue: 180_000, trend: 'up' },
  { name: 'Enterprise Re-Engagement', mqlRate: 15.7, sqlRate: 9.8, wonRevenue: 142_000, trend: 'up' },
  { name: 'Webinar Follow-Up Q1', mqlRate: 14.2, sqlRate: 8.1, wonRevenue: 98_000, trend: 'stable' },
]

export const mockWorstSequences = [
  { name: 'SMB Cold Outreach Legacy', mqlRate: 2.1, sqlRate: 0.9, wonRevenue: 12_000, trend: 'down' },
  { name: 'Industry: Healthcare v1', mqlRate: 3.4, sqlRate: 1.2, wonRevenue: 18_000, trend: 'down' },
]

export const mockTopSegments = [
  { name: 'SaaS / Technology', openRate: 31.2, clickRate: 6.8, mqlRate: 19.4 },
  { name: 'Financial Services', openRate: 28.7, clickRate: 5.9, mqlRate: 16.2 },
  { name: 'Professional Services', openRate: 26.4, clickRate: 5.1, mqlRate: 14.8 },
]

export const mockTopIndustries = [
  { name: 'Software & SaaS', mqls: 98, revenue: 220_000 },
  { name: 'Financial Services', mqls: 74, revenue: 168_000 },
  { name: 'Healthcare Tech', mqls: 52, revenue: 95_000 },
]

export const mockFunnelData = [
  { stage: 'Added to Nurture', count: 8_420, rate: 100 },
  { stage: 'Engaged', count: 3_240, rate: 38.5 },
  { stage: 'MQL', count: 312, rate: 9.6 },
  { stage: 'SQL', count: 187, rate: 59.9 },
  { stage: 'Discovery Call', count: 94, rate: 50.3 },
  { stage: 'Opportunity', count: 61, rate: 64.9 },
  { stage: 'Won', count: 18, rate: 29.5 },
]

export const mockTrendData = Array.from({ length: 12 }, (_, i) => ({
  month: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'][i],
  openRate: 20 + Math.random() * 8,
  clickRate: 3 + Math.random() * 3,
  mqls: 200 + Math.floor(Math.random() * 150),
  revenue: 300_000 + Math.floor(Math.random() * 300_000),
}))

export const mockContactBuckets = {
  hot: 1_840,
  warm: 4_210,
  cold: 6_380,
  inactive: 12_940,
  suppression: 842,
  recycle: 2_180,
}

export const mockOpsSequences = [
  {
    name: 'SaaS Mid-Market Nurture v3',
    segment: 'SaaS / Tech',
    sent: 28_400,
    deliveryRate: 97.1,
    openRate: 31.2,
    clickRate: 6.8,
    ctor: 21.8,
    unsubRate: 0.3,
    mqlRate: 18.4,
    sqlRate: 11.2,
    wonRevenue: 180_000,
    status: 'active',
    delivered: 27560,
    opens: 8861,
    clicks: 1931,
    bounces: 840,
    signal: 'Hot',
  },
  {
    name: 'Enterprise Re-Engagement',
    segment: 'Enterprise',
    sent: 12_100,
    deliveryRate: 95.8,
    openRate: 28.7,
    clickRate: 5.9,
    ctor: 20.6,
    unsubRate: 0.5,
    mqlRate: 15.7,
    sqlRate: 9.8,
    wonRevenue: 142_000,
    status: 'active',
    delivered: 11597,
    opens: 3473,
    clicks: 714,
    bounces: 504,
    signal: 'Hot',
  },
  {
    name: 'Webinar Follow-Up Q1',
    segment: 'Mixed',
    sent: 9_800,
    deliveryRate: 96.4,
    openRate: 26.4,
    clickRate: 5.1,
    ctor: 19.3,
    unsubRate: 0.4,
    mqlRate: 14.2,
    sqlRate: 8.1,
    wonRevenue: 98_000,
    status: 'active',
    delivered: 9447,
    opens: 2587,
    clicks: 500,
    bounces: 353,
    signal: 'Hot',
  },
  {
    name: 'SMB Cold Outreach Legacy',
    segment: 'SMB',
    sent: 42_300,
    deliveryRate: 91.2,
    openRate: 12.4,
    clickRate: 1.8,
    ctor: 14.5,
    unsubRate: 1.2,
    mqlRate: 2.1,
    sqlRate: 0.9,
    wonRevenue: 12_000,
    status: 'active',
    delivered: 38570,
    opens: 5245,
    clicks: 761,
    bounces: 3718,
    signal: 'Cold',
  },
  {
    name: 'Industry: Healthcare v1',
    segment: 'Healthcare',
    sent: 7_200,
    deliveryRate: 93.4,
    openRate: 15.8,
    clickRate: 2.4,
    ctor: 15.2,
    unsubRate: 0.8,
    mqlRate: 3.4,
    sqlRate: 1.2,
    wonRevenue: 18_000,
    status: 'paused',
    delivered: 6725,
    opens: 1138,
    clicks: 173,
    bounces: 475,
    signal: 'Warm',
  },
]

export const mockAiInsight = `Over the past 18 days, email performance has improved meaningfully — unique open rate is up 2.1pp to 24.7%, driven by strong gains in the SaaS Mid-Market and Enterprise Re-Engagement sequences. MQLs grew 11.4% to 312, and won revenue reached $540K, up 28.6% vs. last period.

Key opportunity: The SMB Cold Outreach Legacy sequence is dragging aggregate deliverability down (91.2% delivery rate, 1.2% unsub rate). Suppressing the bottom 20% of inactive contacts in that sequence alone could recover ~0.4pp of overall delivery rate and reduce list churn significantly.

Watch: Discovery-call-to-opportunity conversion dropped from 68% to 64.9%. This may indicate a sales handoff quality issue rather than a marketing performance issue — worth reviewing SQL acceptance criteria with sales leadership.`

export const mockProspectDetail = [
  { id: 1, name: 'Sarah Mitchell', title: 'CEO', delivered: 6, opens: 4, clicks: 2, bounces: 0, unsubs: 0, status: 'Engaged' },
  { id: 2, name: 'James Okafor', title: 'CTO', delivered: 5, opens: 3, clicks: 1, bounces: 0, unsubs: 0, status: 'Engaged' },
  { id: 3, name: 'Priya Nair', title: 'Director of Engineering', delivered: 4, opens: 1, clicks: 0, bounces: 0, unsubs: 0, status: 'Low Open' },
  { id: 4, name: 'Marcus Lee', title: 'VP of Technology', delivered: 5, opens: 0, clicks: 0, bounces: 0, unsubs: 0, status: 'Dark' },
  { id: 5, name: 'Fatima Al-Hassan', title: 'CIO', delivered: 4, opens: 2, clicks: 0, bounces: 0, unsubs: 0, status: 'Low Click' },
  { id: 6, name: 'Tom Eriksen', title: 'Founder / President', delivered: 6, opens: 0, clicks: 0, bounces: 1, unsubs: 0, status: 'Bounced' },
  { id: 7, name: 'Lindsey Park', title: 'IT Manager', delivered: 3, opens: 2, clicks: 1, bounces: 0, unsubs: 0, status: 'Engaged' },
  { id: 8, name: 'Raj Verma', title: 'Director of Technology', delivered: 5, opens: 0, clicks: 0, bounces: 0, unsubs: 1, status: 'Unsub' },
  { id: 9, name: 'Emily Chen', title: 'Chief Revenue Officer', delivered: 7, opens: 5, clicks: 3, bounces: 0, unsubs: 0, status: 'Engaged' },
  { id: 10, name: 'David Park', title: 'VP of Sales', delivered: 4, opens: 0, clicks: 0, bounces: 1, unsubs: 0, status: 'Bounced' },
]

export const mockSubjectLinePerformance = [
  { subject: 'Integration is the real blocker', delivered: 28400, opens: 8861, openRate: 31.2, clicks: 1931, clickRate: 6.8, unsubs: 85, bounces: 142 },
  { subject: 'What good AI looks like in 2026', delivered: 12100, opens: 3473, openRate: 28.7, clicks: 714, clickRate: 5.9, unsubs: 61, bounces: 60 },
  { subject: 'Where AI will pay off, first', delivered: 9800, opens: 2587, openRate: 26.4, clicks: 500, clickRate: 5.1, unsubs: 39, bounces: 49 },
  { subject: 'AI risk rules changed in 2026', delivered: 7200, opens: 1138, openRate: 15.8, clicks: 173, clickRate: 2.4, unsubs: 58, bounces: 67 },
  { subject: 'Why your systems still do not talk', delivered: 42300, opens: 5245, openRate: 12.4, clicks: 761, clickRate: 1.8, unsubs: 508, bounces: 211 },
  { subject: 'How we helped 3x pipeline in 90 days', delivered: 9800, opens: 2998, openRate: 30.6, clicks: 627, clickRate: 6.4, unsubs: 29, bounces: 41 },
  { subject: 'Your Q1 benchmarks are ready', delivered: 12100, opens: 3352, openRate: 27.7, clicks: 641, clickRate: 5.3, unsubs: 55, bounces: 48 },
]

export const mockProspectTitlePerformance = [
  { title: 'CEO', delivered: 4970, opens: 736, openRate: 14.8, clicks: 214, clickRate: 4.3, unsubs: 26, bounces: 188 },
  { title: 'CTO', delivered: 573, opens: 99, openRate: 17.3, clicks: 60, clickRate: 10.5, unsubs: 1, bounces: 22 },
  { title: 'CIO', delivered: 128, opens: 28, openRate: 21.9, clicks: 14, clickRate: 10.9, unsubs: 0, bounces: 5 },
  { title: 'Owner / Founder / Partner', delivered: 2471, opens: 352, openRate: 14.2, clicks: 99, clickRate: 4.0, unsubs: 10, bounces: 94 },
  { title: 'Director of Engineering', delivered: 45, opens: 2, openRate: 4.4, clicks: 0, clickRate: 0, unsubs: 0, bounces: 2 },
  { title: 'VP of Technology', delivered: 18, opens: 0, openRate: 0, clicks: 0, clickRate: 0, unsubs: 0, bounces: 1 },
  { title: 'Director of IT', delivered: 172, opens: 30, openRate: 17.4, clicks: 20, clickRate: 11.6, unsubs: 1, bounces: 7 },
  { title: 'IT Manager', delivered: 30, opens: 13, openRate: 43.3, clicks: 7, clickRate: 23.3, unsubs: 0, bounces: 1 },
  { title: 'Team Lead / Engineer', delivered: 38, opens: 17, openRate: 44.7, clicks: 11, clickRate: 28.9, unsubs: 0, bounces: 2 },
]

export const mockWeeklyTrend = Array.from({ length: 8 }, (_, i) => ({
  week: `W${i + 1}`,
  opens: 280 + Math.floor(Math.random() * 120),
  clicks: 40 + Math.floor(Math.random() * 30),
  bounceRate: 3.2 + Math.random() * 1.2,
  unsubRate: 0.3 + Math.random() * 0.3,
  prospectsAdded: 180 + Math.floor(Math.random() * 200),
  opensPrev: 240 + Math.floor(Math.random() * 100),
  clicksPrev: 35 + Math.floor(Math.random() * 25),
  bounceRatePrev: 3.0 + Math.random() * 1.0,
  unsubRatePrev: 0.25 + Math.random() * 0.25,
  prospectsAddedPrev: 150 + Math.floor(Math.random() * 180),
}))

export const mockMonthlyTrend = Array.from({ length: 6 }, (_, i) => ({
  month: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'][i],
  opens: 3200 + Math.floor(Math.random() * 800),
  clicks: 480 + Math.floor(Math.random() * 200),
  bounceRate: 3.5 + Math.random() * 1.5,
  unsubRate: 0.35 + Math.random() * 0.2,
  prospectsAdded: 1200 + Math.floor(Math.random() * 600),
  opensPrev: 2800 + Math.floor(Math.random() * 700),
  clicksPrev: 400 + Math.floor(Math.random() * 160),
  bounceRatePrev: 3.2 + Math.random() * 1.2,
  unsubRatePrev: 0.3 + Math.random() * 0.2,
  prospectsAddedPrev: 1000 + Math.floor(Math.random() * 500),
}))
