import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// BlackCatPay webhook handler
// Since we couldn't access the docs, this handles a generic payment webhook structure
// and can be adjusted when the exact payload format is known
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const rawPayload = JSON.stringify(payload);

    // Log the webhook
    await prisma.webhookLog.create({
      data: {
        platform: "blackcatpay",
        event: payload.event || payload.type || "unknown",
        payload: rawPayload,
        status: "processing",
      },
    });

    // Extract common fields from webhook payload
    // Adaptable structure for BlackCatPay
    const event = payload.event || payload.type || "";
    const transaction = payload.transaction || payload.data || payload;

    const transactionId =
      transaction.id ||
      transaction.transaction_id ||
      transaction.payment_id ||
      `bcp_${Date.now()}`;

    // Map event to status
    let status = "pending";
    if (event.includes("approved") || event.includes("paid") || event.includes("confirmed") || event === "PAYMENT_CONFIRMED") {
      status = "approved";
    } else if (event.includes("refund")) {
      status = "refunded";
    } else if (event.includes("chargeback") || event.includes("dispute")) {
      status = "chargeback";
    } else if (event.includes("cancel")) {
      status = "cancelled";
    } else if (event.includes("pending") || event.includes("waiting")) {
      status = "pending";
    }

    const amount = parseFloat(
      transaction.amount || transaction.value || transaction.price || "0"
    );

    // Extract customer info
    const customer = transaction.customer || transaction.buyer || transaction.payer || {};
    const customerName = customer.name || customer.full_name || transaction.customer_name || null;
    const customerEmail = customer.email || transaction.customer_email || null;
    const customerPhone = customer.phone || customer.phone_number || transaction.customer_phone || null;

    // Extract payment method
    const paymentMethod = transaction.payment_method || transaction.method || transaction.payment_type || null;

    // Extract UTM parameters (passed via checkout metadata)
    const metadata = transaction.metadata || transaction.tracking || transaction.utm || {};
    const utmSource = metadata.utm_source || metadata.src || null;
    const utmMedium = metadata.utm_medium || null;
    const utmCampaign = metadata.utm_campaign || null;
    const utmContent = metadata.utm_content || null;
    const utmTerm = metadata.utm_term || null;

    // Find the first user to assign the sale (internal tool - single user context)
    const user = await prisma.user.findFirst();
    if (!user) {
      await prisma.webhookLog.updateMany({
        where: { payload: rawPayload, status: "processing" },
        data: { status: "error", errorMessage: "No user found" },
      });
      return NextResponse.json({ error: "No user configured" }, { status: 400 });
    }

    // Find product by name if available
    const productName = transaction.product_name || transaction.product?.name || transaction.offer_name || null;
    let productId: string | null = null;
    if (productName) {
      const product = await prisma.product.findFirst({
        where: { userId: user.id, name: { contains: productName } },
      });
      productId = product?.id || null;
    }

    // Upsert sale (update if transaction already exists)
    const sale = await prisma.sale.upsert({
      where: { transactionId: String(transactionId) },
      update: {
        status,
        amount,
        rawPayload,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        productId,
        transactionId: String(transactionId),
        platform: "blackcatpay",
        status,
        amount,
        currency: "BRL",
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,
        rawPayload,
        saleDate: transaction.created_at ? new Date(transaction.created_at) : new Date(),
      },
    });

    // Create notification for new sales
    if (status === "approved") {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Nova venda aprovada!",
          message: `Venda de R$ ${amount.toFixed(2)} via BlackCatPay`,
          type: "sale",
          metadata: JSON.stringify({ saleId: sale.id, amount }),
        },
      });
    } else if (status === "refunded") {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Reembolso processado",
          message: `Reembolso de R$ ${amount.toFixed(2)} processado`,
          type: "refund",
          metadata: JSON.stringify({ saleId: sale.id, amount }),
        },
      });
    }

    // Update webhook log
    await prisma.webhookLog.updateMany({
      where: { payload: rawPayload, status: "processing" },
      data: { status: "success" },
    });

    return NextResponse.json({ success: true, saleId: sale.id });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
