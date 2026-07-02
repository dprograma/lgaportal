import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      approvedLGAs,
      totalUsers,
      totalProjects,
      completedProjects,
      ongoingProjects,
      totalEndowments,
      investorInquiries,
      issuesReported,
    ] = await Promise.all([
      db.lGA.count({ where: { status: "APPROVED" } }),
      db.user.count({ where: { isBanned: false } }),
      db.project.count({ where: { isPublished: true, approvalStatus: "APPROVED" } }),
      db.project.count({ where: { isPublished: true, approvalStatus: "APPROVED", status: "COMPLETED" } }),
      db.project.count({ where: { isPublished: true, approvalStatus: "APPROVED", status: "IN_PROGRESS" } }),
      db.lGAEndowment.count({ where: { isPublished: true } }),
      db.investorInquiry.count(),
      db.flagReport.count(),
    ]);

    return NextResponse.json({
      approvedLGAs,
      totalUsers,
      totalProjects,
      completedProjects,
      ongoingProjects,
      totalEndowments,
      investorInquiries,
      issuesReported,
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load stats." }, { status: 500 });
  }
}
