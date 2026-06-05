import { db } from "@/lib/db";

export async function GET() {
  try {
    const plans = await db.adPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Serialize BigInt
    const serialized = plans.map((p) => ({
      ...p,
      price: p.price.toString(),
    }));

    return Response.json({ plans: serialized });
  } catch (e) {
    console.error("Ad plans error:", e);
    return Response.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
