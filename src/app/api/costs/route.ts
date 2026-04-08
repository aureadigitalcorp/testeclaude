import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const [costs, categories] = await Promise.all([
      prisma.cost.findMany({
        where: { userId: user.id },
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.costCategory.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      }),
    ]);
    return NextResponse.json({ costs, categories });
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
    const data = await request.json();

    const cost = await prisma.cost.create({
      data: {
        userId: user.id,
        categoryId: data.categoryId || null,
        name: data.name,
        amount: parseFloat(data.amount || "0"),
        type: data.type,
        recurrence: data.recurrence || null,
        isPercentage: data.isPercentage || false,
        percentageValue: data.percentageValue ? parseFloat(data.percentageValue) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
      include: { category: true },
    });
    return NextResponse.json({ cost });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro ao criar custo" }, { status: 500 });
  }
}
