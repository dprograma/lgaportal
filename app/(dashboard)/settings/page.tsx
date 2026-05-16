"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BadgeCheck,
  Lock,
  Bell,
  AlertTriangle,
  LogOut,
  Trash2,
} from "lucide-react";

import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations";
import { PasswordInput } from "@/components/ui/input";
import Button from "@/components/ui/button";

type Tab = "password" | "notifications" | "danger";

function PasswordStrength({ password }: { password: string }) {
  const criteria = [
    { label: "8+ chars", met: password.length >= 8 },
    { label: "Uppercase", met: /[A-Z]/.test(password) },
    { label: "Lowercase", met: /[a-z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
    { label: "Special", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const metCount = criteria.filter((c) => c.met).length;
  const strength =
    metCount <= 1 ? 0 : metCount <= 2 ? 1 : metCount <= 3 ? 2 : metCount <= 4 ? 3 : 4;
  const barColors = [
    "bg-red-500",
    "bg-orange-400",
    "bg-amber-400",
    "bg-green-500",
    "bg-green-600",
  ];
  const textColors = [
    "text-red-600",
    "text-orange-500",
    "text-amber-600",
    "text-green-600",
    "text-green-700",
  ];
  const labels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength + 1 ? barColors[strength] : "bg-slate-100"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${textColors[strength]}`}>
        {labels[strength]}
      </span>
    </div>
  );
}

function DeleteConfirmModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-elevated max-w-md w-full p-6"
      >
        <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Account</h3>
        <p className="text-sm text-slate-500 mb-4">
          This action is permanent and cannot be undone. All your data will be deleted. To
          confirm, type <strong className="text-slate-800">DELETE</strong> below.
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE to confirm"
          className="w-full h-11 px-3 rounded-lg border border-slate-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400"
        />
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            loading={loading}
            disabled={confirmText !== "DELETE"}
            onClick={onConfirm}
          >
            Delete Account
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("password");
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPassword = watch("newPassword", "");

  const onPasswordSubmit = async (data: ChangePasswordInput) => {
    setPwLoading(true);
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to change password.");
        return;
      }
      toast.success("Password changed successfully!");
      reset();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to delete account. Please try again.");
        return;
      }
      await signOut({ redirect: false });
      router.push("/");
      toast.success("Account deleted.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "password", label: "Change Password", icon: <Lock className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200 text-green-800 text-[11px] font-bold uppercase tracking-widest mb-3">
              <BadgeCheck className="h-3 w-3" />
              Account Settings
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your account security and preferences.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogOut className="h-4 w-4" />}
            loading={logoutLoading}
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Pill tab bar */}
      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-green-700 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {/* Password tab */}
        {activeTab === "password" && (
          <motion.div
            key="password"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-green-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Change Password
                  </h3>
                </div>

                <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <PasswordInput
                    label="Current Password"
                    placeholder="Your current password"
                    error={errors.currentPassword?.message}
                    {...register("currentPassword")}
                  />
                  <div className="space-y-1">
                    <PasswordInput
                      label="New Password"
                      placeholder="Create a new password"
                      error={errors.newPassword?.message}
                      {...register("newPassword")}
                    />
                    <PasswordStrength password={newPassword} />
                  </div>
                  <PasswordInput
                    label="Confirm New Password"
                    placeholder="Repeat your new password"
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                  />
                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" loading={pwLoading}>
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {/* Notifications tab */}
        {activeTab === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-green-700 via-green-500 to-green-400" />
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-green-700" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Notification Preferences
                  </h3>
                </div>

                <div>
                  {[
                    {
                      label: "Email Notifications",
                      description: "Receive updates about your LGA projects via email",
                    },
                    {
                      label: "Push Notifications",
                      description: "Get browser push notifications for important alerts",
                    },
                    {
                      label: "Weekly Digest",
                      description: "Receive a weekly summary of LGA activities",
                    },
                    {
                      label: "Allocation Alerts",
                      description: "Be notified when new allocations are published",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Danger Zone tab */}
        {activeTab === "danger" && (
          <motion.div
            key="danger"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-400" />
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-8 w-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide">
                    Danger Zone
                  </h3>
                </div>

                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h4 className="text-sm font-semibold text-red-700 mb-1">Delete Account</h4>
                  <p className="text-xs text-red-500 mb-4">
                    Permanently delete your account and all associated data. This action
                    cannot be undone.
                  </p>
                  <Button
                    variant="danger"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <DeleteConfirmModal
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDeleteAccount}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
