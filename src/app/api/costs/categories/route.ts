import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { name, description } = await request.json();
    const category = await prisma.costCategory.create({
      data: { userId: user.id, name, description },
    });
    return NextResponse.json({ category });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
