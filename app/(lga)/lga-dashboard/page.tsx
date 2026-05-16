import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Note: In a real implementation, get the LGA session from cookies/JWT
// For now this shows the structure with mock/demo data
export default async function LGADashboardPage() {
  // In production, decode LGA session from cookie
  // const lga = await getLGAFromSession(cookies());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-green-600" />
              <h1 className="text-2xl font-bold text-slate-900">LGA Dashboard</h1>
            </div>
            <p className="text-slate-500 text-sm">Manage your LGA portal and citizen communications.</p>
          </div>
          <Badge variant="warning">Pending Approval</Badge>
        </div>
      </div>

      {/* Pending notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Awaiting Admin Review</p>
          <p className="text-sm text-amber-600 mt-0.5">
            Your LGA registration is currently under review by our admin team. This usually
            takes 1–3 business days. You will receive an email once your account is approved.
          </p>
        </div>
      </div>

      {/* LGA info cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">LGA Name</p>
                <p className="text-sm font-semibold text-slate-900">Lagos Island LGA</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">State</p>
                <p className="text-sm font-semibold text-slate-900">Lagos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Status</p>
                <p className="text-sm font-semibold text-slate-900">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What to expect section */}
      <Card>
        <CardContent>
          <h3 className="text-base font-semibold text-slate-900 mb-4">What happens next?</h3>
          <div className="space-y-3">
            {[
              {
                icon: CheckCircle,
                iconBg: "bg-green-50",
                iconColor: "text-green-600",
                title: "Email Verified",
                description: "Your email address has been confirmed.",
                done: true,
              },
              {
                icon: Clock,
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                title: "Admin Review",
                description: "Our team will review your LGA registration documents.",
                done: false,
              },
              {
                icon: Building2,
                iconBg: "bg-slate-50",
                iconColor: "text-slate-400",
                title: "Account Activated",
                description: "Once approved, you will have full access to the LGA dashboard.",
                done: false,
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-4.5 w-4.5 ${item.iconColor}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.done ? "text-green-700" : "text-slate-700"}`}>
                    {item.title}
                    {item.done && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Done</span>}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
