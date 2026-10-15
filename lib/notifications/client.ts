export interface NotificationItem {
  id: string;
  text: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationsPayload {
  notifications: NotificationItem[];
  unread: number;
}

let inFlight: Promise<NotificationsPayload> | null = null;

/** Coalesce concurrent bell loads (initial render + first open). */
export function fetchNotifications(): Promise<NotificationsPayload> {
  if (inFlight) return inFlight;
  inFlight = fetch("/api/notifications", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("failed");
      const json = (await response.json()) as { data: NotificationsPayload | null };
      if (!json.data) throw new Error("failed");
      return json.data;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
