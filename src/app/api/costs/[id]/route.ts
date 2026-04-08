import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const data = await request.json();
    const cost = await prisma.cost.update({
      where: { id, userId: user.id },
      data: {
        categoryId: data.categoryId,
        name: data.name,
        amount: data.amount !== undefined ? parseFloat(data.amount) : undefined,
        type: data.type,
        recurrence: data.recurrence,
        isPercentage: data.isPercentage,
        percentageValue: data.percentageValue !== undefined ? parseFloat(data.percentageValue) : undefined,
        active: data.active,
      },
      include: { category: true },
    });
    return NextResponse.json({ cost });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await prisma.cost.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro" }, { status: 500 });
  }
}
