"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  BadgeCheck,
  Camera,
  User,
  Phone,
  MapPin,
  Mail,
  CalendarDays,
  Save,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations";
import { NIGERIA_STATES } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Button from "@/components/ui/button";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: "",
      state: "",
      lga: "",
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      setAvatarFile(base64);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, image: avatarFile }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to update profile.");
        return;
      }
      await update({ name: data.name, picture: json.user?.image });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const avatarSrc = avatarPreview ?? user?.image ?? null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-bold uppercase tracking-widest mb-3">
              <BadgeCheck className="h-3 w-3" />
              Citizen Account
            </div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your personal information and account details.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Avatar card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                <User className="h-4 w-4 text-green-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Profile Photo
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-green-50 ring-4 ring-green-100/50 flex items-center justify-center">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-green-600" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center hover:bg-green-50 transition-colors"
                  aria-label="Change photo"
                >
                  <Camera className="h-3.5 w-3.5 text-slate-600" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold text-slate-900">
                  {user?.name ?? "—"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-3">
                  Click the camera icon to update your photo · Max 2MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal info card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Personal Information
              </h3>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Your full name"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register("name")}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="08012345678"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phone?.message}
                {...register("phone")}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="State"
                      placeholder="Select state"
                      error={errors.state?.message}
                      {...field}
                    >
                      {NIGERIA_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                <Input
                  label="LGA"
                  placeholder="Your LGA"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  error={errors.lga?.message}
                  {...register("lga")}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Account info card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-green-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Account Information
              </h3>
            </div>

            <div>
              {/* Email */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Mail className="h-4 w-4" />
                  Email address
                </div>
                <span className="text-sm font-medium text-slate-800">
                  {user?.email}
                </span>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Role
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  {(user as { role?: string })?.role ?? "CITIZEN"}
                </span>
              </div>

              {/* Account status */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Account status
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
