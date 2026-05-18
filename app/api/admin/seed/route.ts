import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { NIGERIA_DATA } from "@/prisma/seeds/nigeria-lgas";

// Protect with a secret so this can't be triggered publicly
const SEED_SECRET = process.env.SEED_SECRET ?? "";

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const { secret } = await req.json().catch(() => ({ secret: "" }));

  if (!SEED_SECRET || secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let lgaCount = 0, wardCount = 0;

  for (const stateData of NIGERIA_DATA) {
    for (const lgaSeed of stateData.lgas) {
      const lgaSlug = slug(lgaSeed.name);
      const stSlug  = slug(stateData.state);
      const email   = `${lgaSlug}-${stSlug}@lga.gov.ng`;

      const lga = await db.lGA.upsert({
        where:  { email },
        update: {},
        create: {
          lgaName:      lgaSeed.name,
          state:        stateData.state,
          chairmanName: "Vacant",
          email,
          phone:        "N/A",
          officeAddress:`${lgaSeed.name} LGA Secretariat, ${stateData.state} State`,
          description:  `${lgaSeed.name} is a Local Government Area in ${stateData.state} State, ${stateData.zone} geopolitical zone of Nigeria.`,
          sectors:      ["Governance","Community Development"],
          status:       "APPROVED",
          isVerified:   true,
        },
      });

      await db.ward.deleteMany({
        where: { lgaId: lga.id, councillorName: "Vacant" },
      });

      await db.ward.createMany({
        data: lgaSeed.wards.map((wardName, idx) => ({
          lgaId:          lga.id,
          wardName,
          wardNumber:     idx + 1,
          councillorName: "Vacant",
          isActive:       true,
        })),
        skipDuplicates: true,
      });

      lgaCount  += 1;
      wardCount += lgaSeed.wards.length;
    }
  }

  return NextResponse.json({
    success: true,
    message: `Seeded ${lgaCount} LGAs and ${wardCount} wards.`,
  });
}
