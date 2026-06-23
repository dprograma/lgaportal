import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";
const auth = (req: NextRequest) => req.headers.get("x-admin-secret") === ADMIN_SECRET;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const contract = await db.procurementContract.update({
    where: { id },
    data: {
      ...(body.title      ? { title: body.title }           : {}),
      ...(body.contractor ? { contractor: body.contractor } : {}),
      ...(body.value      ? { value: BigInt(body.value) }   : {}),
      ...(body.awardDate  ? { awardDate: new Date(body.awardDate) } : {}),
      ...(body.scope      ? { scope: body.scope }           : {}),
      ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
    },
  });

  return NextResponse.json({ contract: { ...contract, value: contract.value.toString() } });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!auth(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.procurementContract.delete({ where: { id } });
  return NextResponse.json({ message: "Contract deleted." });
}
