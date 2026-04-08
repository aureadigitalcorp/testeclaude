"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRealtime } from "@/hooks/use-realtime";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NotificationData {
  unreadCount: number;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
}

export function Header() {
  const { data } = useRealtime<NotificationData>("/api/notifications?limit=5", 15000);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur-sm">
      <div>
        <h2 className="text-sm text-zinc-400">Bem-vindo ao</h2>
        <h1 className="text-lg font-bold text-zinc-100">LucroFy</h1>
      </div>

      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {showNotifications && (
          <div className="absolute right-0 top-12 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
            <div className="border-b border-zinc-800 p-4">
              <h3 className="font-semibold text-zinc-100">Notificações</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {data?.notifications && data.notifications.length > 0 ? (
                data.notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "border-b border-zinc-800 p-4 last:border-0",
                      !n.read && "bg-emerald-500/5"
                    )}
                  >
                    <p className="text-sm font-medium text-zinc-100">{n.title}</p>
                    <p className="text-xs text-zinc-400">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-zinc-500">
                  Nenhuma notificação
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <div className="border-t border-zinc-800 p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={async () => {
                    await fetch("/api/notifications/read-all", { method: "POST" });
                    setShowNotifications(false);
                  }}
                >
                  Marcar todas como lidas
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
