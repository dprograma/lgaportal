import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { NIGERIA_DATA } from "./seeds/nigeria-lgas";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter } as any);

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("🌱 Seeding Nigerian LGAs and Wards...");
  let lgaCount = 0, wardCount = 0;

  for (const stateData of NIGERIA_DATA) {
    console.log(`  → ${stateData.state} (${stateData.lgas.length} LGAs)`);

    for (const lgaSeed of stateData.lgas) {
      const lgaSlug  = slug(lgaSeed.name);
      const stSlug   = slug(stateData.state);
      const email    = `${lgaSlug}-${stSlug}@lga.gov.ng`;

      // Upsert so re-runs are safe
      const lga = await prisma.lGA.upsert({
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

      // Delete existing seeded wards (councillorName === "Vacant") then re-create
      await prisma.ward.deleteMany({
        where: { lgaId: lga.id, councillorName: "Vacant" },
      });

      await prisma.ward.createMany({
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

  console.log(`\n✅ Done — ${lgaCount} LGAs, ${wardCount} wards seeded.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
