import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { getCampaignInsights, getAdSetInsights, getAdInsights } from "@/lib/meta-api";

export async function POST() {
  try {
    const user = await requireAuth();

    const accounts = await prisma.metaAccount.findMany({
      where: { userId: user.id, status: "active" },
    });

    const results = [];

    for (const account of accounts) {
      try {
        const opts = { accessToken: account.accessToken, accountId: account.accountId };

        // Sync campaigns
        const campaignData = await getCampaignInsights(opts);
        if (campaignData.data) {
          for (const c of campaignData.data) {
            await prisma.campaign.upsert({
              where: {
                metaAccountId_campaignId: {
                  metaAccountId: account.id,
                  campaignId: c.campaign_id,
                },
              },
              update: {
                name: c.campaign_name || "Unnamed",
                spend: parseFloat(c.spend || "0"),
                impressions: parseInt(c.impressions || "0"),
                clicks: parseInt(c.clicks || "0"),
                cpm: parseFloat(c.cpm || "0"),
                cpc: parseFloat(c.cpc || "0"),
                ctr: parseFloat(c.ctr || "0"),
                lastSyncAt: new Date(),
              },
              create: {
                metaAccountId: account.id,
                campaignId: c.campaign_id,
                name: c.campaign_name || "Unnamed",
                status: "ACTIVE",
                spend: parseFloat(c.spend || "0"),
                impressions: parseInt(c.impressions || "0"),
                clicks: parseInt(c.clicks || "0"),
                cpm: parseFloat(c.cpm || "0"),
                cpc: parseFloat(c.cpc || "0"),
                ctr: parseFloat(c.ctr || "0"),
                lastSyncAt: new Date(),
              },
            });
          }
        }

        // Sync ad sets
        const adSetData = await getAdSetInsights(opts);
        if (adSetData.data) {
          for (const as_ of adSetData.data) {
            const campaign = await prisma.campaign.findFirst({
              where: { metaAccountId: account.id, campaignId: as_.campaign_id },
            });
            if (!campaign) continue;

            await prisma.adSet.upsert({
              where: {
                campaignId_adSetId: {
                  campaignId: campaign.id,
                  adSetId: as_.adset_id,
                },
              },
              update: {
                name: as_.adset_name || "Unnamed",
                spend: parseFloat(as_.spend || "0"),
                impressions: parseInt(as_.impressions || "0"),
                clicks: parseInt(as_.clicks || "0"),
                cpm: parseFloat(as_.cpm || "0"),
                cpc: parseFloat(as_.cpc || "0"),
                ctr: parseFloat(as_.ctr || "0"),
                lastSyncAt: new Date(),
              },
              create: {
                campaignId: campaign.id,
                adSetId: as_.adset_id,
                name: as_.adset_name || "Unnamed",
                status: "ACTIVE",
                spend: parseFloat(as_.spend || "0"),
                impressions: parseInt(as_.impressions || "0"),
                clicks: parseInt(as_.clicks || "0"),
                cpm: parseFloat(as_.cpm || "0"),
                cpc: parseFloat(as_.cpc || "0"),
                ctr: parseFloat(as_.ctr || "0"),
                lastSyncAt: new Date(),
              },
            });
          }
        }

        // Sync ads
        const adData = await getAdInsights(opts);
        if (adData.data) {
          for (const ad of adData.data) {
            const adSet = await prisma.adSet.findFirst({
              where: { campaign: { metaAccountId: account.id }, adSetId: ad.adset_id },
            });
            if (!adSet) continue;

            await prisma.ad.upsert({
              where: {
                adSetId_adId: {
                  adSetId: adSet.id,
                  adId: ad.ad_id,
                },
              },
              update: {
                name: ad.ad_name || "Unnamed",
                spend: parseFloat(ad.spend || "0"),
                impressions: parseInt(ad.impressions || "0"),
                clicks: parseInt(ad.clicks || "0"),
                cpm: parseFloat(ad.cpm || "0"),
                cpc: parseFloat(ad.cpc || "0"),
                ctr: parseFloat(ad.ctr || "0"),
                lastSyncAt: new Date(),
              },
              create: {
                adSetId: adSet.id,
                adId: ad.ad_id,
                name: ad.ad_name || "Unnamed",
                status: "ACTIVE",
                spend: parseFloat(ad.spend || "0"),
                impressions: parseInt(ad.impressions || "0"),
                clicks: parseInt(ad.clicks || "0"),
                cpm: parseFloat(ad.cpm || "0"),
                cpc: parseFloat(ad.cpc || "0"),
                ctr: parseFloat(ad.ctr || "0"),
                lastSyncAt: new Date(),
              },
            });
          }
        }

        await prisma.metaAccount.update({
          where: { id: account.id },
          data: { lastSyncAt: new Date() },
        });

        results.push({ accountId: account.accountId, status: "synced" });
      } catch (err) {
        console.error(`Sync error for ${account.accountId}:`, err);
        results.push({ accountId: account.accountId, status: "error", error: (err as Error).message });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro na sincronização" }, { status: 500 });
  }
}
