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
  },
]

export const mockAiInsight = `Over the past 18 days, email performance has improved meaningfully — unique open rate is up 2.1pp to 24.7%, driven by strong gains in the SaaS Mid-Market and Enterprise Re-Engagement sequences. MQLs grew 11.4% to 312, and won revenue reached $540K, up 28.6% vs. last period.

Key opportunity: The SMB Cold Outreach Legacy sequence is dragging aggregate deliverability down (91.2% delivery rate, 1.2% unsub rate). Suppressing the bottom 20% of inactive contacts in that sequence alone could recover ~0.4pp of overall delivery rate and reduce list churn significantly.

Watch: Discovery-call-to-opportunity conversion dropped from 68% to 64.9%. This may indicate a sales handoff quality issue rather than a marketing performance issue — worth reviewing SQL acceptance criteria with sales leadership.`
