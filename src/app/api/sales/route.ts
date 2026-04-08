import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");
    const period = searchParams.get("period");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const utmSource = searchParams.get("utmSource");
    const utmCampaign = searchParams.get("utmCampaign");
    const productId = searchParams.get("productId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = { userId: user.id };

    if (status && status !== "all") {
      where.status = status;
    }

    if (utmSource) where.utmSource = utmSource;
    if (utmCampaign) where.utmCampaign = utmCampaign;
    if (productId) where.productId = productId;

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerEmail: { contains: search, mode: "insensitive" } },
        { transactionId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Date filtering
    if (startDate && endDate) {
      where.saleDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (period) {
      const now = new Date();
      const start = new Date();
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
      }
      where.saleDate = { gte: start, lte: now };
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: where as any,
        include: { product: true },
        orderBy: { saleDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where: where as any }),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error("Sales error:", error);
    return NextResponse.json({ error: "Erro ao buscar vendas" }, { status: 500 });
  }
}
