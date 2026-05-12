import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — Equestrai" },
      { name: "description", content: "Chat with the IALHA member-support assistant." },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; escalated?: boolean };

function ChatPage() {
  const user = useUser();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the Equestrai member assistant. Ask me about registrations, transfers, fees, or the studbook.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const history = messages;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-member-chat", {
        body: {
          message: text,
          conversation_history: history.map((m) => ({ role: m.role, content: m.content })),
          user_id: user?.id ?? null,
        },
      });
      if (error) throw error;
      const reply = (data as { reply?: string }).reply ?? "(no reply)";
      const escalated = !!(data as { escalated?: boolean }).escalated;
      setMessages((m) => [...m, { role: "assistant", content: reply, escalated }]);
    } catch (err: any) {
      toast.error(err.message ?? "Chat failed");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Sorry — something went wrong. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-12rem)] max-w-3xl flex-col">
      <header className="mb-4">
        <h1 className="font-serif text-3xl text-primary">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Get instant answers from our member-support assistant.
        </p>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-2xl border bg-card p-4"
      >
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} />
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-pulse text-secondary" />
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-4 flex gap-2"
      >
        <Input
          value={input}
          placeholder="Type your message…"
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
        />
        <Button
          type="submit"
          disabled={sending || !input.trim()}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
        {msg.escalated && (
          <p className="mt-2 rounded-md border border-secondary/40 bg-secondary/10 px-2 py-1 text-xs font-semibold text-secondary">
            A staff member will follow up with you shortly.
          </p>
        )}
      </div>
    </div>
  );
}
