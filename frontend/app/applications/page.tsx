"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { useAuth } from "../../lib/auth";
import api from "../../lib/api";
import Link from "next/link";

type LoanApplication = {
  id: number;
  amount: string;
  tenure: number;
  status: string;
  purpose: string | null;
  created_at: string;
};

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const endpoint = user.role === "customer" ? "/api/loan-applications/mine" : "/api/loan-applications/";

    api
      .get(endpoint)
      .then((res) => setApplications(res.data))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          {user.role === "customer" ? "My Applications" : "All Applications"}
        </h1>
        {user.role === "customer" && (
          <Link
            href="/applications/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Application
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="text-gray-500">No applications found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tenure</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">#{app.id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">₹{app.amount}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{app.tenure} mo</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {app.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <Link href={`/applications/${app.id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}