"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Pencil, Trash2, Users, X, CheckCircle2,
  AlertCircle, Inbox, Phone, Mail, Hash, UserCircle2,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface Ward {
  id:              string;
  wardName:        string;
  wardNumber:      number | null;
  councillorName:  string;
  councillorEmail: string | null;
  councillorPhone: string | null;
  councillorImage: string | null;
  description:     string | null;
  population:      string | null;
  isActive:        boolean;
}

/* ─── Zod schema ─────────────────────────────────────────────────────────── */
const schema = z.object({
  wardName:        z.string().min(1, "Ward name is required").max(100),
  wardNumber:      z.string().optional(),   // kept as string in the form, cast on submit
  councillorName:  z.string().min(2, "Councillor name is required").max(100),
  councillorEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  councillorPhone: z.string().optional(),
  councillorImage: z.string().optional(),
  description:     z.string().max(1000).optional(),
  population:      z.string().optional(),
  isActive:        z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const DEMO_LGA_ID = "demo-lga-id";

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function WardsPage() {
  const [wards, setWards]             = useState<Ward[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Ward | null>(null);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg]   = useState("");

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
    watch, setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      wardName: "", wardNumber: "", councillorName: "",
      councillorEmail: "", councillorPhone: "", councillorImage: "",
      description: "", population: "", isActive: true,
    },
  });

  const isActive = watch("isActive");

  /* ── Load ──────────────────────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/lgas/wards?lgaId=${DEMO_LGA_ID}`);
      const json = await res.json();
      setWards(json.wards ?? []);
    } catch { /* empty state shown */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ── Open form ─────────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    reset({
      wardName: "", wardNumber: "", councillorName: "",
      councillorEmail: "", councillorPhone: "", councillorImage: "",
      description: "", population: "", isActive: true,
    });
    setServerError("");
    setSuccessMsg("");
    setShowForm(true);
  };

  const openEdit = (w: Ward) => {
    setEditing(w);
    reset({
      wardName:        w.wardName,
      wardNumber:      w.wardNumber?.toString() ?? "",
      councillorName:  w.councillorName,
      councillorEmail: w.councillorEmail  ?? "",
      councillorPhone: w.councillorPhone  ?? "",
      councillorImage: w.councillorImage  ?? "",
      description:     w.description      ?? "",
      population:      w.population       ?? "",
      isActive:        w.isActive,
    });
    setServerError("");
    setSuccessMsg("");
    setShowForm(true);
  };

  /* ── Submit ────────────────────────────────────────────────────────────── */
  const onSubmit = async (values: FormValues) => {
    setServerError("");
    const payload = {
      ...(editing ? { id: editing.id } : { lgaId: DEMO_LGA_ID }),
      wardName:        values.wardName,
      wardNumber:      values.wardNumber ? parseInt(values.wardNumber, 10) : undefined,
      councillorName:  values.councillorName,
      councillorEmail: values.councillorEmail  || null,
      councillorPhone: values.councillorPhone  || null,
      councillorImage: values.councillorImage  || null,
      description:     values.description      || null,
      population:      values.population       || null,
      isActive:        values.isActive,
    };

    try {
      const res  = await fetch("/api/lgas/wards", {
        method:  editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Something went wrong."); return; }
      setSuccessMsg(editing ? "Ward updated." : "Ward added.");
      setShowForm(false);
      load();
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  /* ── Delete ────────────────────────────────────────────────────────────── */
  const deleteWard = async (id: string) => {
    if (!confirm("Delete this ward?")) return;
    await fetch(`/api/lgas/wards?id=${id}`, { method: "DELETE" });
    load();
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-5 w-5 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">Wards & Councillors</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Manage the wards under your LGA and the councillors who represent them.
            This information is publicly visible to citizens.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Ward
        </button>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* ── Form modal ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">
                  {editing ? "Edit Ward" : "Add New Ward"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Ward name + number */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ward Name *
                    </label>
                    <input
                      {...register("wardName")}
                      placeholder="e.g. Agbado Ward"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                    {errors.wardName && (
                      <p className="text-xs text-red-500 mt-1">{errors.wardName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ward No.
                    </label>
                    <input
                      {...register("wardNumber")}
                      type="number"
                      min="1"
                      placeholder="1"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                </div>

                {/* Councillor name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Councillor Name *
                  </label>
                  <input
                    {...register("councillorName")}
                    placeholder="e.g. Hon. Chukwuemeka Eze"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                  />
                  {errors.councillorName && (
                    <p className="text-xs text-red-500 mt-1">{errors.councillorName.message}</p>
                  )}
                </div>

                {/* Councillor email + phone */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Councillor Email
                    </label>
                    <input
                      {...register("councillorEmail")}
                      type="email"
                      placeholder="councillor@lga.gov.ng"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                    {errors.councillorEmail && (
                      <p className="text-xs text-red-500 mt-1">{errors.councillorEmail.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Councillor Phone
                    </label>
                    <input
                      {...register("councillorPhone")}
                      type="tel"
                      placeholder="+234 800 000 0000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                </div>

                {/* Photo URL + population */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Councillor Photo URL
                    </label>
                    <input
                      {...register("councillorImage")}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Ward Population
                    </label>
                    <input
                      {...register("population")}
                      placeholder="e.g. 45,000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Ward Description <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Brief description of this ward — key communities, notable areas..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none"
                  />
                </div>

                {/* Active toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => setValue("isActive", !isActive)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isActive ? "bg-green-600" : "bg-slate-300"
                    }`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                      isActive ? "translate-x-[18px]" : "translate-x-1"
                    }`} />
                  </button>
                  <span className="text-xs font-medium text-slate-700">
                    Ward is active and publicly visible
                  </span>
                </label>

                {serverError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {serverError}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                  >
                    {isSubmitting ? "Saving…" : editing ? "Save Changes" : "Add Ward"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Ward list ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : wards.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No wards added yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Add each ward and its elected councillor to show citizens their representatives.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Add First Ward
          </button>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Wards",        value: wards.length },
              { label: "Active Wards",       value: wards.filter((w) => w.isActive).length },
              { label: "Councillors Listed", value: wards.filter((w) => w.councillorName).length },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-green-700">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wards.map((ward) => (
              <div
                key={ward.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  ward.isActive
                    ? "border-slate-200 hover:border-green-300 hover:shadow-sm"
                    : "border-slate-100 opacity-60"
                }`}
              >
                <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                <div className="p-4">
                  {/* Ward header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {ward.wardNumber && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded-md">
                            <Hash className="h-2.5 w-2.5" />{ward.wardNumber}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-slate-900">{ward.wardName}</h3>
                      </div>
                      {ward.population && (
                        <p className="text-[10px] text-slate-400">Pop. {ward.population}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ward.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {ward.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Councillor info */}
                  <div className="flex items-center gap-2.5 mb-3 p-2.5 bg-slate-50 rounded-xl">
                    {ward.councillorImage ? (
                      <img
                        src={ward.councillorImage}
                        alt={ward.councillorName}
                        className="h-9 w-9 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                        <UserCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {ward.councillorName}
                      </p>
                      <p className="text-[10px] text-slate-400">Councillor</p>
                    </div>
                  </div>

                  {/* Contact chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {ward.councillorPhone && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                        <Phone className="h-2.5 w-2.5" />{ward.councillorPhone}
                      </span>
                    )}
                    {ward.councillorEmail && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full truncate max-w-full">
                        <Mail className="h-2.5 w-2.5" />{ward.councillorEmail}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEdit(ward)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 font-medium transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => deleteWard(ward.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-xs text-red-600 font-medium transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
