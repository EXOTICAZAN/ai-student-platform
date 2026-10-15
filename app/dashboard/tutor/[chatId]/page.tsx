import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import ChatInput from "@/components/chat/ChatInput";
import UploadPdf from "@/components/chat/UploadPdf";
import { ChatProvider } from "@/components/chat/context/ChatContext";

interface Props {
  params: Promise<{ chatId: string }>;
}

export const metadata = { title: "AI Tutor — EduForge AI" };

export default async function ChatPage({ params }: Props) {
  const { chatId } = await params;

  const { supabase, user } = await getAuthContext();

  if (!user) redirect("/login");

  const [{ data: chat }, { data: chats }, { data: profile }] =
    await Promise.all([
      supabase
        .from("chats")
        .select("*")
        .eq("id", chatId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("chats")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  const name = profile?.full_name || user.email?.split("@")[0] || "Learner";

  if (!chat) {
    return (
      <DashboardShell userName={name} userEmail={user.email ?? ""}>
        <div className="mx-auto max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 text-center">
          <h1 className="text-lg font-semibold text-white">Chat not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            This conversation does not exist or belongs to another account.
          </p>
          <Link
            href="/dashboard/tutor"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Back to the tutor
          </Link>
        </div>
      </DashboardShell>
    );
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  return (
    <ChatProvider initialMessages={messages ?? []}>
      <DashboardShell userName={name} userEmail={user.email ?? ""} immersive>
        <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="hidden min-h-0 border-r border-white/[0.08] lg:block">
            <ChatSidebar chats={chats ?? []} activeId={chat.id} />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#080c19]">
            <div className="shrink-0 border-b border-white/[0.07] px-6 py-4">
              <h1 className="truncate text-lg font-semibold text-white">
                {chat.title}
              </h1>
            </div>

            <ChatWindow />

            <div className="shrink-0 border-t border-white/[0.07] px-6 py-3">
              <UploadPdf chatId={chat.id} />
            </div>

            <ChatInput chatId={chat.id} />
          </div>
        </div>
      </DashboardShell>
    </ChatProvider>
  );
}
