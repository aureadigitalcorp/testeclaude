const META_API_VERSION = "v19.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

interface MetaApiOptions {
  accessToken: string;
  accountId: string;
}

export interface MetaCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpm: string;
  cpc: string;
  ctr: string;
}

export interface MetaAdSetInsight {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  status: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpm: string;
  cpc: string;
  ctr: string;
}

export interface MetaAdInsight {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  status: string;
  spend: string;
  impressions: string;
  clicks: string;
  cpm: string;
  cpc: string;
  ctr: string;
}

async function metaFetch(url: string, accessToken: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error?.message || "Meta API Error");
  }
  return res.json();
}

export async function getCampaigns({ accessToken, accountId }: MetaApiOptions) {
  const fields = "id,name,status,objective,daily_budget,lifetime_budget";
  const url = `${META_API_BASE}/act_${accountId}/campaigns?fields=${fields}&access_token=${accessToken}`;
  return metaFetch(url, accessToken);
}

export async function getCampaignInsights(
  { accessToken, accountId }: MetaApiOptions,
  dateRange?: { since: string; until: string }
) {
  const fields = "campaign_id,campaign_name,spend,impressions,clicks,cpm,cpc,ctr";
  let url = `${META_API_BASE}/act_${accountId}/insights?fields=${fields}&level=campaign&access_token=${accessToken}`;
  if (dateRange) {
    url += `&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}`;
  }
  return metaFetch(url, accessToken);
}

export async function getAdSetInsights(
  { accessToken, accountId }: MetaApiOptions,
  dateRange?: { since: string; until: string }
) {
  const fields = "adset_id,adset_name,campaign_id,spend,impressions,clicks,cpm,cpc,ctr";
  let url = `${META_API_BASE}/act_${accountId}/insights?fields=${fields}&level=adset&access_token=${accessToken}`;
  if (dateRange) {
    url += `&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}`;
  }
  return metaFetch(url, accessToken);
}

export async function getAdInsights(
  { accessToken, accountId }: MetaApiOptions,
  dateRange?: { since: string; until: string }
) {
  const fields = "ad_id,ad_name,adset_id,spend,impressions,clicks,cpm,cpc,ctr";
  let url = `${META_API_BASE}/act_${accountId}/insights?fields=${fields}&level=ad&access_token=${accessToken}`;
  if (dateRange) {
    url += `&time_range={"since":"${dateRange.since}","until":"${dateRange.until}"}`;
  }
  return metaFetch(url, accessToken);
}

export async function getAccountInfo({ accessToken, accountId }: MetaApiOptions) {
  const fields = "name,account_status,currency,timezone_name";
  const url = `${META_API_BASE}/act_${accountId}?fields=${fields}&access_token=${accessToken}`;
  return metaFetch(url, accessToken);
}
