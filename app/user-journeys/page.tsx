import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserJourneysClient from "@/components/user-journeys/journeys-client";

export const metadata = {
  title: "User Journeys – 774ng.com LGA Portal",
  description:
    "How citizens, LGA chairmen, investors, and platform admins each move through the 774ng.com portal, screen by screen.",
};

export default function UserJourneysPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-green-700 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">User Journeys</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Four people open the same portal for four different reasons. Here is exactly
            what each one sees, screen by screen, route by route.
          </p>
        </div>
      </div>

      <UserJourneysClient />
    </div>
  );
}
