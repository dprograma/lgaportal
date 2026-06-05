import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get("type") ?? "user"; // "user" | "lga"
  const lgaId = searchParams.get("lgaId") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const purpose = searchParams.get("purpose") ?? undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pageSize = 20;

  const where: Record<string, unknown> = {};

  if (type === "lga" && lgaId) {
    where.lgaId = lgaId;
  } else {
    where.userId = session.user.id;
  }

  if (purpose) where.purpose = purpose;

  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
  }

  try {
    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.transaction.count({ where }),
    ]);

    return Response.json({
      transactions: transactions.map((t) => ({ ...t, amount: t.amount.toString() })),
      total,
      pages: Math.ceil(total / pageSize),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
