"use client";

import { useAuth } from "../../lib/auth";
import AppShell from "../../components/AppShell";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Dashboard</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-900">
          Welcome, <span className="font-medium">{user.name}</span>
        </p>
        <p className="text-sm text-gray-500">
          Role: {user.role} · Email: {user.email}
        </p>
      </div>
    </AppShell>
  );
}