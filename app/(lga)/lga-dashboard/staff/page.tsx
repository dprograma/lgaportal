"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Trash2, Edit3, AlertCircle, CheckCircle2,
  Mail, Phone, Shield, ShieldOff, X, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";

// Session helper — reads lgaId from sessionStorage
function getLgaId(): string { return typeof window !== "undefined" ? sessionStorage.getItem("lgaId") ?? "" : ""; }

const schema = z.object({
  name:       z.string().min(2, "Name must be at least 2 characters"),
  email:      z.email("Valid email required"),
  phone:      z.string().optional(),
  role:       z.string().default("STAFF"),
  canPublish: z.boolean(),
  password:   z.string().min(8, "Password must be at least 8 characters"),
});
type FormValues = z.infer<typeof schema>;

interface StaffMember {
  id: string; name: string; email: string; phone?: string;
  role: string; isActive: boolean; canPublish: boolean; createdAt: string;
}

export default function StaffPage() {
  const [staff,    setStaff]    = useState<StaffMember[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showModal,setShowModal]= useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", role: "STAFF", canPublish: false, password: "" },
  });

  const lgaId = getLgaId();

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/lga-dashboard/staff", { headers: { "x-lga-id": lgaId } });
      const data = await res.json();
      setStaff(data.staff ?? []);
    } catch { toast.error("Failed to load staff."); }
    finally { setLoading(false); }
  }, [lgaId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const onSubmit = async (data: FormValues) => {
    try {
      const res  = await fetch("/api/lga-dashboard/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error); return; }
      toast.success("Staff member added.");
      setShowModal(false);
      reset();
      fetchStaff();
    } catch { toast.error("Something went wrong."); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    try {
      const res  = await fetch(`/api/lga-dashboard/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-lga-id": lgaId },
        body: JSON.stringify({ canPublish: !current }),
      });
      if (!res.ok) { toast.error("Update failed."); return; }
      toast.success(`Publish rights ${!current ? "granted" : "revoked"}.`);
      fetchStaff();
    } catch { toast.error("Something went wrong."); }
  };

  const deleteStaff = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/lga-dashboard/staff/${id}`, {
        method: "DELETE", headers: { "x-lga-id": lgaId },
      });
      if (!res.ok) { toast.error("Delete failed."); return; }
      toast.success("Staff member removed.");
      fetchStaff();
    } catch { toast.error("Something went wrong."); }
    finally { setDeleting(null); }
  };

  const isFull = staff.length >= 2;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage up to 2 staff members for your LGA</p>
        </div>
        <button
          onClick={() => { if (isFull) { toast.error("Maximum 2 staff allowed."); return; } setShowModal(true); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isFull ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-green-700 hover:bg-green-800 text-white"
          }`}
        >
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      {/* Capacity bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-700">Staff slots used</span>
            <span className={isFull ? "text-amber-600 font-semibold" : "text-green-700 font-semibold"}>
              {staff.length} / 2
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isFull ? "bg-amber-400" : "bg-green-500"}`}
              style={{ width: `${(staff.length / 2) * 100}%` }}
            />
          </div>
        </div>
        {isFull && (
          <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
            <AlertCircle className="h-3.5 w-3.5" />
            Limit reached
          </div>
        )}
      </div>

      {/* Policy note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
        <p className="font-semibold mb-1">Staff Posting Policy</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-amber-700">
          <li>Staff can draft posts but require Chairman approval to publish (if publish rights not granted)</li>
          <li>All staff posting rights are automatically revoked if Chairman subscription lapses</li>
          <li>Maximum 2 staff accounts per LGA</li>
        </ul>
      </div>

      {/* Staff list */}
      {loading ? (
        <div className="space-y-3">
          {[0,1].map((i) => <div key={i} className="bg-white rounded-2xl border border-slate-200 h-24 animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Users className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No staff members yet</p>
          <p className="text-xs text-slate-400 mt-1">Add up to 2 staff members to help manage your LGA</p>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map((s) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-5"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-base shrink-0">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{s.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{s.role}</span>
                    {s.canPublish ? (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs flex items-center gap-1">
                        <Shield className="h-2.5 w-2.5" /> Can Publish
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs flex items-center gap-1">
                        <ShieldOff className="h-2.5 w-2.5" /> Draft Only
                      </span>
                    )}
                    {!s.isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs">Inactive</span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>
                    {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(s.id, s.canPublish)}
                    className="p-2 rounded-lg border border-slate-200 hover:border-green-400 text-slate-500 hover:text-green-700 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteStaff(s.id)}
                    disabled={deleting === s.id}
                    className="p-2 rounded-lg border border-slate-200 hover:border-red-400 text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); reset(); } }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Add Staff Member</h3>
                <button onClick={() => { setShowModal(false); reset(); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {[
                  { id: "name",  label: "Full Name",    type: "text",  ph: "Amaka Nwosu" },
                  { id: "email", label: "Email Address", type: "email", ph: "staff@lga.gov.ng" },
                  { id: "phone", label: "Phone (optional)", type: "tel", ph: "08012345678" },
                ].map(({ id, label, type, ph }) => (
                  <div key={id}>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                    <input
                      {...register(id as keyof FormValues)}
                      type={type}
                      placeholder={ph}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100"
                    />
                    {errors[id as keyof FormValues] && (
                      <p className="mt-1 text-xs text-red-600">{String(errors[id as keyof FormValues]?.message)}</p>
                    )}
                  </div>
                ))}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Temporary Password</label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="Min 8 characters"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100"
                    />
                    <button type="button" onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                </div>

                {/* Can Publish toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Can Publish Directly</p>
                    <p className="text-xs text-slate-400">Allow staff to publish without Chairman approval</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" {...register("canPublish")} className="sr-only peer" />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-green-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); reset(); }}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {isSubmitting && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Add Staff
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
