import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const links = await prisma.uTMLink.findMany({
      where: { userId: user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ links });
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

    const url = new URL(data.baseUrl);
    url.searchParams.set("utm_source", data.utmSource);
    url.searchParams.set("utm_medium", data.utmMedium);
    url.searchParams.set("utm_campaign", data.utmCampaign);
    if (data.utmContent) url.searchParams.set("utm_content", data.utmContent);
    if (data.utmTerm) url.searchParams.set("utm_term", data.utmTerm);

    const link = await prisma.uTMLink.create({
      data: {
        userId: user.id,
        productId: data.productId || null,
        baseUrl: data.baseUrl,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        utmContent: data.utmContent || null,
        utmTerm: data.utmTerm || null,
        fullUrl: url.toString(),
      },
      include: { product: true },
    });
    return NextResponse.json({ link });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Erro ao criar link" }, { status: 500 });
  }
}
