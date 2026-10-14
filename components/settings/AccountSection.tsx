"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { KeyRound, LogOut, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Card, CardTitle } from "@/components/ui/Badge";
import { Field, Input } from "@/components/ui/Field";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount, deleteAllUserData } from "@/app/dashboard/settings/actions";
import { fadeUp, stagger } from "@/lib/motion";

interface Props {
  userId: string;
  email: string;
  memberSince: string;
  projectRef: string;
}

const DELETE_CONFIRM_WORD = "DELETE";

export default function AccountSection({
  userId,
  email,
  memberSince,
  projectRef,
}: Props) {
  const router = useRouter();

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // "data" keeps the login; "account" removes it as well.
  const [deleteMode, setDeleteMode] = useState<"data" | "account">("data");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const memberSinceLabel = new Date(memberSince).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function onChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (changingPassword) return;

    if (!passwords.current) {
      toast.error("Enter your current password.");
      return;
    }
    if (passwords.next.length < 8) {
      toast.error("The new password must be at least 8 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast.error("The new passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      const supabase = createClient();
      let { error } = await supabase.auth.updateUser({ password: passwords.next });

      if (error) {
        // Stale session — prove identity with the current password, retry once.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: passwords.current,
        });
        if (signInError) {
          throw new Error(
            signInError.message === "Invalid login credentials"
              ? "Your current password is incorrect."
              : signInError.message
          );
        }

        ({ error } = await supabase.auth.updateUser({ password: passwords.next }));
        if (error) throw new Error(error.message);
      }

      toast.success("Password updated.");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not change the password."
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function onSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  async function onConfirmDeleteAll() {
    if (deleting) return;

    setDeleting(true);
    try {
      const res =
        deleteMode === "account"
          ? await deleteAccount()
          : await deleteAllUserData();
      if (!res.ok) throw new Error(res.error ?? "Could not delete your data.");

      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success(
        deleteMode === "account"
          ? "Your account has been deleted."
          : "All your data has been deleted. You are now signed out."
      );
      setDeleteOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete your data."
      );
      setDeleting(false);
    }
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <motion.div variants={fadeUp}>
        <Card>
          <CardTitle>Session info</CardTitle>

          <dl className="grid gap-3 sm:grid-cols-2">
            <SessionRow label="User ID" value={userId} mono />
            <SessionRow label="Email" value={email} />
            <SessionRow label="Member since" value={memberSinceLabel} />
            <SessionRow label="Supabase project" value={projectRef} mono />
          </dl>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-rose-300">
            Danger zone
          </h2>
          <p className="mb-4 text-[13px] text-slate-400">
            Irreversible and security-sensitive actions live here.
          </p>

          <form
            onSubmit={onChangePassword}
            className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white">
              <KeyRound className="h-4 w-4 text-rose-300" />
              Change password
            </h3>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Current password">
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, current: e.target.value }))
                  }
                  autoComplete="current-password"
                  disabled={changingPassword}
                />
              </Field>
              <Field label="New password" hint="At least 8 characters.">
                <Input
                  type="password"
                  value={passwords.next}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, next: e.target.value }))
                  }
                  autoComplete="new-password"
                  disabled={changingPassword}
                />
              </Field>
              <Field label="Confirm new password">
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) =>
                    setPasswords((p) => ({ ...p, confirm: e.target.value }))
                  }
                  autoComplete="new-password"
                  disabled={changingPassword}
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                variant="secondary"
                loading={changingPassword}
                disabled={
                  !passwords.current || !passwords.next || !passwords.confirm
                }
              >
                Update password
              </Button>
            </div>
          </form>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-white">Sign out</h3>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Ends this session and returns you to the landing page. Signing
                out of every device at once is not available on this Supabase
                plan.
              </p>
            </div>
            <Button variant="secondary" onClick={() => void onSignOut()} loading={signingOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-rose-200">
                Delete all my data
              </h3>
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">
                Permanently erases your notes, documents, flashcards, quizzes,
                study tasks, activity history, notifications, profile and app
                settings, then signs you out. Your login is kept, so you can
                sign in again and start fresh.
              </p>
            </div>
            <Button
              variant="danger"
              className="shrink-0"
              onClick={() => {
                setDeleteMode("data");
                setDeleteConfirm("");
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete all my data
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-rose-200">
                Delete my account
              </h3>
              <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">
                Does everything above and also removes your login, so this
                email can no longer sign in. This cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              className="shrink-0"
              onClick={() => {
                setDeleteMode("account");
                setDeleteConfirm("");
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete my account
            </Button>
          </div>
        </div>
      </motion.div>

      <Modal
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title={deleteMode === "account" ? "Delete your account?" : "Delete all your data?"}
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void onConfirmDeleteAll()}
              loading={deleting}
              disabled={deleteConfirm !== DELETE_CONFIRM_WORD}
            >
              <Trash2 className="h-4 w-4" />
              {deleteMode === "account" ? "Delete my account" : "Delete everything"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-slate-400">
            This permanently removes every note, document, flashcard deck,
            quiz, study task, activity entry, notification and setting on your
            account{deleteMode === "account" ? ", and removes your login" : ""}, then
            signs you out. It cannot be undone.
          </p>
          <Field
            label={`Type ${DELETE_CONFIRM_WORD} to confirm`}
            hint={
              deleteMode === "account"
                ? "Your login is removed too."
                : "Your login remains — only your data and profile are erased."
            }
          >
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
              placeholder={DELETE_CONFIRM_WORD}
              disabled={deleting}
              autoComplete="off"
            />
          </Field>
        </div>
      </Modal>
    </motion.div>
  );
}

function SessionRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3">
      <dt className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={
          mono
            ? "mt-1 truncate font-mono text-[12px] text-slate-300"
            : "mt-1 truncate text-[13px] text-slate-300"
        }
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}
