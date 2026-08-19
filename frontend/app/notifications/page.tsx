"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";

type Notification = {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function fetchNotifications() {
    try {
      const res = await api.get("/api/notifications/", {
        params: { unread_only: filter === "unread" },
      });
      setNotifications(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      await fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to mark as read");
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) return <AppShell><div className="text-center py-12">Loading...</div></AppShell>;
  if (error) return <AppShell><div className="text-red-600 py-12">{error}</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex gap-2 rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => setFilter("all")}
              className={`rounded px-4 py-1 text-sm font-medium transition ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded px-4 py-1 text-sm font-medium transition ${
                filter === "unread"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <div className="text-gray-400 mb-3">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <p className="text-gray-500">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 transition ${
                  notification.is_read
                    ? "border-gray-200 bg-white"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="ml-4 text-sm text-blue-600 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        {notifications.length > 0 && (
          <div className="mt-6 text-sm text-gray-500">
            Showing {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <h3 className="mb-2 font-semibold">About Notifications:</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>You will be notified when your loan application status changes</li>
            <li>Payment confirmations are logged as notifications</li>
            <li>Staff members receive notifications for new applications and actions</li>
            <li>Notifications are stored in the database (email/SMS integration not implemented)</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
