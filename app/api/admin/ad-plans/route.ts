import { NextRequest } from "next/server";
import { db } from "@/lib/db";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const plans = await db.adPlan.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return Response.json({
      plans: plans.map((p) => ({ ...p, price: p.price.toString() })),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name: string;
    description: string;
    price: number;
    durationDays: number;
    formats: string[];
    placements: string[];
    maxImpressions?: number;
    sortOrder?: number;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, price, durationDays, formats, placements, maxImpressions, sortOrder } = body;
  if (!name || !description || !price || !durationDays || !formats?.length || !placements?.length) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const plan = await db.adPlan.create({
      data: {
        name,
        description,
        price: BigInt(price),
        durationDays,
        formats,
        placements,
        maxImpressions: maxImpressions ?? null,
        sortOrder: sortOrder ?? 0,
      },
    });
    return Response.json({ plan: { ...plan, price: plan.price.toString() } }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create plan" }, { status: 500 });
  }
}
