"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Wheat, Gem, Beef, Fish,
  TreePine, Zap, MapPin, Factory, TrendingUp, X, CheckCircle2,
  AlertCircle, Inbox,
} from "lucide-react";

/* ─── Types & constants ──────────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "AGRICULTURE",   label: "Agriculture",    icon: Wheat    },
  { id: "MINERALS",      label: "Solid Minerals", icon: Gem      },
  { id: "LIVESTOCK",     label: "Livestock",      icon: Beef     },
  { id: "FISHERIES",     label: "Fisheries",      icon: Fish     },
  { id: "FORESTRY",      label: "Forestry",       icon: TreePine },
  { id: "ENERGY",        label: "Energy",         icon: Zap      },
  { id: "TOURISM",       label: "Tourism",        icon: MapPin   },
  { id: "MANUFACTURING", label: "Manufacturing",  icon: Factory  },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

interface Endowment {
  id:             string;
  category:       CategoryId;
  title:          string;
  description:    string;
  highlights:     string[];
  investmentRange?: string | null;
  contactPerson?: string | null;
  contactEmail?:  string | null;
  isPublished:    boolean;
  createdAt:      string;
}

/* ─── Zod schema ─────────────────────────────────────────────────────────── */
const schema = z.object({
  category:       z.string().min(1, "Select a category"),
  title:          z.string().min(3, "Title is required").max(120),
  description:    z.string().min(10, "Provide a description").max(2000),
  highlights:     z.string().min(1, "Add at least one highlight"),
  investmentRange: z.string().optional(),
  contactPerson:  z.string().optional(),
  contactEmail:   z.string().email("Enter a valid email").optional().or(z.literal("")),
  isPublished:    z.boolean().optional().default(true),
});
type FormValues = z.infer<typeof schema>;

/* ─── Hardcoded LGA ID placeholder ─────────────────────────────────────────
   In production this comes from the authenticated LGA session / cookie.      */
const DEMO_LGA_ID = "demo-lga-id";

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function EndowmentsPage() {
  const [endowments, setEndowments]   = useState<Endowment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Endowment | null>(null);
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg]   = useState("");

  const {
    register, handleSubmit, reset, control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  /* ── Load endowments ─────────────────────────────────────────────────── */
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lgas/endowments?lgaId=${DEMO_LGA_ID}`);
      const json = await res.json();
      setEndowments(json.endowments ?? []);
    } catch {
      // silently fall through — empty state shown
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ── Open form ───────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    reset({ category: "", title: "", description: "", highlights: "", isPublished: true });
    setShowForm(true);
    setServerError("");
    setSuccessMsg("");
  };

  const openEdit = (e: Endowment) => {
    setEditing(e);
    reset({
      category:       e.category,
      title:          e.title,
      description:    e.description,
      highlights:     e.highlights.join("\n"),
      investmentRange: e.investmentRange ?? "",
      contactPerson:  e.contactPerson  ?? "",
      contactEmail:   e.contactEmail   ?? "",
      isPublished:    e.isPublished,
    });
    setShowForm(true);
    setServerError("");
    setSuccessMsg("");
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const onSubmit = async (values: FormValues) => {
    setServerError("");
    const highlights = values.highlights
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...(editing ? { id: editing.id } : { lgaId: DEMO_LGA_ID }),
      category:       values.category,
      title:          values.title,
      description:    values.description,
      highlights,
      investmentRange: values.investmentRange ?? null,
      contactPerson:  values.contactPerson  ?? null,
      contactEmail:   values.contactEmail   || null,
      isPublished:    values.isPublished ?? true,
    };

    try {
      const res = await fetch("/api/lgas/endowments", {
        method:  editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) { setServerError(json.error ?? "Something went wrong."); return; }
      setSuccessMsg(editing ? "Endowment updated." : "Endowment published.");
      setShowForm(false);
      load();
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  /* ── Toggle publish ──────────────────────────────────────────────────── */
  const togglePublish = async (e: Endowment) => {
    await fetch("/api/lgas/endowments", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: e.id, isPublished: !e.isPublished }),
    });
    load();
  };

  /* ── Delete ──────────────────────────────────────────────────────────── */
  const deleteEndowment = async (id: string) => {
    if (!confirm("Delete this endowment listing?")) return;
    await fetch(`/api/lgas/endowments?id=${id}`, { method: "DELETE" });
    load();
  };

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const catMeta = (id: string) =>
    CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h1 className="text-2xl font-bold text-slate-900">Natural Endowments</h1>
          </div>
          <p className="text-slate-500 text-sm">
            List your LGA&apos;s natural resources and investment opportunities.
            Verified listings appear on the public LGA Portal investment section.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Endowment
        </button>
      </div>

      {/* Feedback banners */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ── Form modal ─────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400 rounded-t-2xl" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold text-slate-900">
                  {editing ? "Edit Endowment" : "Add New Endowment"}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Resource Category *</label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-4 gap-2">
                        {CATEGORIES.map(({ id, label, icon: Icon }) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => field.onChange(id)}
                            className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border text-[11px] font-medium transition-all ${
                              field.value === id
                                ? "bg-green-700 border-green-700 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-green-300"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  />
                  {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Title *</label>
                  <input
                    {...register("title")}
                    placeholder="e.g. Coal & Limestone Deposits"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description *</label>
                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Describe this natural endowment in detail..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none"
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                </div>

                {/* Highlights */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Key Highlights * <span className="font-normal text-slate-400">(one per line)</span>
                  </label>
                  <textarea
                    {...register("highlights")}
                    rows={3}
                    placeholder={"Extensive coal seams — commercially viable\nHigh-grade limestone for cement\nProximity to major rail network"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition resize-none"
                  />
                  {errors.highlights && <p className="text-xs text-red-500 mt-1">{errors.highlights.message}</p>}
                </div>

                {/* Investment range + contact */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Investment Range</label>
                    <input
                      {...register("investmentRange")}
                      placeholder="e.g. ₦500M – ₦5B"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Person</label>
                    <input
                      {...register("contactPerson")}
                      placeholder="Investment Desk Officer"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Contact Email</label>
                  <input
                    {...register("contactEmail")}
                    type="email"
                    placeholder="invest@yourlga.gov.ng"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/10 transition"
                  />
                  {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail.message}</p>}
                </div>

                {/* Publish toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <Controller
                    name="isPublished"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          field.value ? "bg-green-600" : "bg-slate-300"
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                          field.value ? "translate-x-[18px]" : "translate-x-1"
                        }`} />
                      </button>
                    )}
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Publish immediately (visible on public portal)
                  </span>
                </label>

                {serverError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {serverError}
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
                    {isSubmitting ? "Saving…" : editing ? "Save Changes" : "Publish Endowment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Endowment list ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : endowments.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <Inbox className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No endowments listed yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Add your first natural resource or investment opportunity.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Endowment
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {endowments.map((e) => {
            const meta = catMeta(e.category);
            const Icon = meta.icon;
            return (
              <div
                key={e.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-green-300 hover:shadow-sm transition-all"
              >
                {/* Top bar */}
                <div className="h-1.5 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                        <Icon className="h-4.5 w-4.5 text-green-700" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">
                          {meta.label}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {e.title}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        e.isPublished
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {e.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">
                    {e.description}
                  </p>

                  {e.investmentRange && (
                    <p className="text-xs font-semibold text-green-700 mb-3">
                      {e.investmentRange}
                    </p>
                  )}

                  {/* Action row */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEdit(e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 font-medium transition-colors"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => togglePublish(e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs text-slate-600 font-medium transition-colors"
                    >
                      {e.isPublished
                        ? <><EyeOff className="h-3 w-3" /> Unpublish</>
                        : <><Eye className="h-3 w-3" /> Publish</>
                      }
                    </button>
                    <button
                      onClick={() => deleteEndowment(e.id)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-xs text-red-600 font-medium transition-colors"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
