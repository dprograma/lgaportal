import { NextRequest } from "next/server";
import { db } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 20;

  const where = status ? { status } : {};

  try {
    const [campaigns, total] = await Promise.all([
      db.adCampaign.findMany({
        where,
        include: {
          advertiser: { select: { id: true, name: true, email: true } },
          plan: { select: { name: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.adCampaign.count({ where }),
    ]);

    return Response.json({
      campaigns: campaigns.map((c) => ({
        ...c,
        plan: { ...c.plan, price: c.plan.price.toString() },
      })),
      total,
      pages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
