import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const accounts = await prisma.metaAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        accountId: true,
        accountName: true,
        status: true,
        lastSyncAt: true,
        createdAt: true,
        _count: { select: { campaigns: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { accountId, accountName, accessToken, appId, appSecret } = await request.json();

    const account = await prisma.metaAccount.create({
      data: {
        userId: user.id,
        accountId,
        accountName,
        accessToken,
        appId: appId || null,
        appSecret: appSecret || null,
      },
    });
    return NextResponse.json({ account });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro ao adicionar conta" }, { status: 500 });
  }
}
