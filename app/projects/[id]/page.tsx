import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Calendar, MapPin, BadgeCheck, Banknote, Building2 } from "lucide-react";
import ProjectGallery from "@/components/projects/ProjectGallery";
import ReactionBar from "@/components/engagement/ReactionBar";
import ShareButtons from "@/components/engagement/ShareButtons";
import CommentSection from "@/components/engagement/CommentSection";
import ReportButton from "@/components/engagement/ReportButton";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function fetchProject(id: string) {
  // Try by id first, then slug
  let project = await db.project.findFirst({
    where: { id, isPublished: true, approvalStatus: "APPROVED" },
    include: { lga: { select: { id: true, lgaName: true, state: true } } },
  });
  if (!project) {
    project = await db.project.findFirst({
      where: { slug: id, isPublished: true, approvalStatus: "APPROVED" },
      include: { lga: { select: { id: true, lgaName: true, state: true } } },
    });
  }
  return project;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const project = await fetchProject(id);
  if (!project) return { title: "Project Not Found" };

  const previousImages = (await parent).openGraph?.images ?? [];
  const firstImage = project.images[0] ?? null;

  return {
    title: `${project.title} — ${project.lga.lgaName}`,
    description: project.description.slice(0, 160),
    openGraph: {
      title: project.title,
      description: project.description.slice(0, 160),
      images: firstImage ? [firstImage, ...previousImages] : previousImages,
    },
  };
}

function formatCurrency(kobo: bigint | null): string {
  if (!kobo) return "N/A";
  const amount = Number(kobo) / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount);
}

function formatDate(date: Date | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_LABELS: Record<string, string> = {
  ROADS_INFRASTRUCTURE: "Roads & Infrastructure",
  HEALTH: "Health",
  EDUCATION: "Education",
  WATER: "Water",
  AGRICULTURE: "Agriculture",
  OTHER: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = await fetchProject(id);
  if (!project) notFound();

  const pageUrl = `${process.env.NEXTAUTH_URL ?? "https://lgaportal.ng"}/projects/${id}`;
  const reactionCounts = await db.reaction
    .findMany({ where: { projectId: project.id }, select: { type: true } })
    .then((rs) => {
      const c: Record<string, number> = {};
      for (const r of rs) c[r.type] = (c[r.type] ?? 0) + 1;
      return c;
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500 mb-6">
        <a href="/" className="hover:text-green-700">Home</a>
        {" / "}
        <a href="/lgas" className="hover:text-green-700">LGAs</a>
        {" / "}
        <span className="text-slate-800 font-medium">{project.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-800">
            {CATEGORY_LABELS[project.category] ?? project.category}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-700"}`}>
            {project.status.replace("_", " ")}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          {project.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {project.lga.lgaName}, {project.lga.state}
          </span>
          {project.startDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Started {formatDate(project.startDate)}
            </span>
          )}
          {project.expectedEndDate && (
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4" />
              Expected {formatDate(project.expectedEndDate)}
            </span>
          )}
          {project.budget && (
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <Banknote className="h-4 w-4" />
              {formatCurrency(project.budget)}
            </span>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="mb-8">
        <ProjectGallery images={project.images} videoUrl={project.videoUrl ?? undefined} />
      </div>

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-3">About This Project</h2>
        <div
          className="prose prose-slate max-w-none text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: project.description }}
        />
      </div>

      {/* Location */}
      {(project.latitude && project.longitude) ? (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-600" /> Location
          </h2>
          <div className="rounded-xl overflow-hidden border border-slate-200 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
            <MapPin className="h-6 w-6 mr-2" />
            {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)}
          </div>
        </div>
      ) : null}

      {/* Engagement — client section */}
      <div className="border-t border-slate-200 pt-6 space-y-6">
        {/* Reaction bar + share */}
        <div className="flex flex-wrap items-center gap-4">
          <ReactionBar
            contentId={project.id}
            contentType="project"
            initialCounts={reactionCounts}
          />
          <div className="ml-auto">
            <ShareButtons
              title={project.title}
              url={pageUrl}
              imageUrl={project.images[0] ?? undefined}
            />
          </div>
        </div>

        {/* Report button */}
        <div className="flex justify-end">
          <ReportButton contentId={project.id} contentType="project" />
        </div>

        {/* Comments */}
        <CommentSection contentId={project.id} contentType="project" />
      </div>
    </div>
  );
}
