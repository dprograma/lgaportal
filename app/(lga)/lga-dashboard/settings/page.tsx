"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Lock, Building2, CheckCircle } from "lucide-react";

const SECTORS = [
  "Agriculture","Minerals","Livestock","Fisheries","Forestry",
  "Energy","Tourism","Manufacturing","Education","Health","Commerce",
];

interface LGAProfile {
  id: string; lgaName: string; state: string; chairmanName: string;
  email: string; phone: string; officeAddress: string;
  population: string | null; description: string | null;
  sectors: string[]; status: string; isVerified: boolean;
}

function getLgaId() {
  return typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : "";
}

export default function LGASettingsPage() {
  const [profile,  setProfile]  = useState<LGAProfile | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Profile form state
  const [phone,         setPhone]         = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [population,    setPopulation]    = useState("");
  const [description,   setDescription]  = useState("");
  const [sectors,       setSectors]       = useState<string[]>([]);

  // Password form state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving,  setPwdSaving]  = useState(false);

  useEffect(() => {
    const lgaId = getLgaId();
    if (!lgaId) { setLoading(false); return; }

    fetch("/api/lga-dashboard/profile", { headers: { "x-lga-id": lgaId } })
      .then((r) => r.json())
      .then((d) => {
        if (d.lga) {
          setProfile(d.lga);
          setPhone(d.lga.phone ?? "");
          setOfficeAddress(d.lga.officeAddress ?? "");
          setPopulation(d.lga.population ?? "");
          setDescription(d.lga.description ?? "");
          setSectors(d.lga.sectors ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleSector = (s: string) =>
    setSectors((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const saveProfile = async () => {
    if (!profile) return;
    if (sectors.length === 0) { toast.error("Select at least one sector."); return; }
    setSaving(true);
    try {
      const lgaId = getLgaId();
      const res = await fetch("/api/lga-dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
        body: JSON.stringify({ phone, officeAddress, population: population || null, description: description || null, sectors }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to save."); return; }
      toast.success("Profile updated successfully.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPwd || !currentPwd) { toast.error("Fill in all password fields."); return; }
    if (newPwd.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd) { toast.error("New passwords do not match."); return; }
    setPwdSaving(true);
    try {
      const lgaId = getLgaId();
      const res = await fetch("/api/lga-dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to update password."); return; }
      toast.success("Password changed successfully.");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="h-7 w-7 animate-spin text-green-600" />
    </div>
  );

  if (!profile) return (
    <div className="p-6 text-center text-slate-500">Could not load profile. Please refresh.</div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your LGA profile and account security.</p>
      </div>

      {/* Read-only identity */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-green-600" />
          <h2 className="font-semibold text-slate-900 text-sm">LGA Identity</h2>
          {profile.isVerified && (
            <span className="flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              <CheckCircle className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "LGA Name",       value: profile.lgaName },
            { label: "State",          value: profile.state },
            { label: "Chairman",       value: profile.chairmanName },
            { label: "Email",          value: profile.email },
            { label: "Account Status", value: profile.status },
          ].map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          To update your LGA name, state, or chairman name, contact the portal admin.
        </p>
      </div>

      {/* Editable profile */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm">Contact & Description</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+234 800 000 0000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Office Address</label>
          <input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)}
            placeholder="LGA Secretariat address"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Population (optional)</label>
          <input value={population} onChange={(e) => setPopulation(e.target.value)}
            placeholder="e.g. 250,000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">About this LGA</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={4} placeholder="Brief description of your LGA..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Key Sectors</label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button key={s} type="button" onClick={() => toggleSector(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  sectors.includes(s)
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-white text-slate-600 border-slate-200 hover:border-green-400"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={saveProfile} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Password change */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-green-600" />
          <h2 className="font-semibold text-slate-900 text-sm">Change Password</h2>
        </div>

        {[
          { label: "Current Password", value: currentPwd, setter: setCurrentPwd },
          { label: "New Password",     value: newPwd,     setter: setNewPwd },
          { label: "Confirm New Password", value: confirmPwd, setter: setConfirmPwd },
        ].map(({ label, value, setter }) => (
          <div key={label}>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
            <input type="password" value={value} onChange={(e) => setter(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition" />
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <button onClick={changePassword} disabled={pwdSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-sm font-semibold transition-colors">
            {pwdSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {pwdSaving ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
