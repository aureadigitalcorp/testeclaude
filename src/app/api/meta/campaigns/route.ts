import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    const where: Record<string, unknown> = {
      metaAccount: { userId: user.id },
    };

    if (accountId) {
      where.metaAccountId = accountId;
    }

    const campaigns = await prisma.campaign.findMany({
      where: where as any,
      include: {
        metaAccount: { select: { accountName: true, accountId: true } },
        adSets: {
          include: {
            ads: true,
          },
        },
      },
      orderBy: { spend: "desc" },
    });

    return NextResponse.json({ campaigns });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
