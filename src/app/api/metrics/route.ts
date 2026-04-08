import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const period = searchParams.get("period") || "30d";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    let start: Date;
    let end = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date();
      switch (period) {
        case "today":
          start.setHours(0, 0, 0, 0);
          break;
        case "7d":
          start.setDate(start.getDate() - 7);
          break;
        case "30d":
          start.setDate(start.getDate() - 30);
          break;
        case "90d":
          start.setDate(start.getDate() - 90);
          break;
        default:
          start.setDate(start.getDate() - 30);
      }
    }

    const dateFilter = {
      gte: start,
      lte: end,
    };

    // Get sales metrics
    const [
      approvedSales,
      pendingSales,
      refundedSales,
      allSalesInPeriod,
      totalAdsSpend,
      fixedCosts,
      percentageCosts,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { userId: user.id, status: "approved", saleDate: dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { userId: user.id, status: "pending", saleDate: dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.aggregate({
        where: { userId: user.id, status: "refunded", saleDate: dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.count({
        where: { userId: user.id, saleDate: dateFilter },
      }),
      // Get total ads spend from all campaigns synced in period
      prisma.campaign.aggregate({
        where: {
          metaAccount: { userId: user.id },
          updatedAt: dateFilter,
        },
        _sum: { spend: true },
      }),
      // Fixed costs
      prisma.cost.findMany({
        where: {
          userId: user.id,
          active: true,
          isPercentage: false,
          OR: [
            { endDate: null },
            { endDate: { gte: start } },
          ],
        },
      }),
      // Percentage-based costs
      prisma.cost.findMany({
        where: {
          userId: user.id,
          active: true,
          isPercentage: true,
        },
      }),
    ]);

    const revenue = approvedSales._sum.amount || 0;
    const refundedAmount = refundedSales._sum.amount || 0;
    const netRevenue = revenue - refundedAmount;
    const adSpend = totalAdsSpend._sum.spend || 0;
    const salesCount = approvedSales._count;
    const refundCount = refundedSales._count;

    // Calculate fixed costs for the period
    let totalFixedCosts = 0;
    for (const cost of fixedCosts) {
      if (cost.recurrence === "monthly") {
        // Proportional monthly cost for the period
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalFixedCosts += (cost.amount / 30) * days;
      } else if (cost.recurrence === "weekly") {
        const weeks = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
        totalFixedCosts += cost.amount * weeks;
      } else {
        totalFixedCosts += cost.amount;
      }
    }

    // Calculate percentage-based costs
    let totalPercentageCosts = 0;
    for (const cost of percentageCosts) {
      totalPercentageCosts += revenue * ((cost.percentageValue || 0) / 100);
    }

    const totalAdditionalCosts = totalFixedCosts + totalPercentageCosts;

    // Gross profit: Revenue - Ad Spend
    const grossProfit = netRevenue - adSpend;

    // Net profit: Revenue - Ad Spend - All additional costs
    const netProfit = netRevenue - adSpend - totalAdditionalCosts;

    // ROAS: Revenue / Ad Spend
    const roas = adSpend > 0 ? netRevenue / adSpend : 0;

    // ROI: (Profit / Investment) * 100
    const totalInvestment = adSpend + totalAdditionalCosts;
    const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    // CPA: Ad Spend / Number of Sales
    const cpa = salesCount > 0 ? adSpend / salesCount : 0;

    // Conversion rate (would need click data from Meta)
    const totalClicks = (await prisma.campaign.aggregate({
      where: { metaAccount: { userId: user.id }, updatedAt: dateFilter },
      _sum: { clicks: true },
    }))._sum.clicks || 0;
    const conversionRate = totalClicks > 0 ? (salesCount / totalClicks) * 100 : 0;

    // Daily breakdown for charts
    const salesByDay = await prisma.sale.groupBy({
      by: ["saleDate"],
      where: {
        userId: user.id,
        status: "approved",
        saleDate: dateFilter,
      },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      overview: {
        revenue: netRevenue,
        grossRevenue: revenue,
        refundedAmount,
        adSpend,
        grossProfit,
        netProfit,
        additionalCosts: totalAdditionalCosts,
        fixedCosts: totalFixedCosts,
        percentageCosts: totalPercentageCosts,
        roas,
        roi,
        cpa,
        conversionRate,
        salesCount,
        refundCount,
        pendingCount: pendingSales._count,
        pendingAmount: pendingSales._sum.amount || 0,
        totalTransactions: allSalesInPeriod,
      },
      chartData: salesByDay,
      period: { start, end },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Metrics error:", error);
    return NextResponse.json({ error: "Erro ao buscar métricas" }, { status: 500 });
  }
}
