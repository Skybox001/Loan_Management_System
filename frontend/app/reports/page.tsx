"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

export default function ReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState("");

  const canViewReports = user?.role && ["credit_manager", "super_admin"].includes(user.role);
  const canViewEMIReport = user?.role && ["loan_officer", "credit_manager", "super_admin"].includes(user.role);

  async function downloadReport(reportType: string) {
    setLoading(reportType);
    try {
      let url = "";
      let filename = "";

      switch (reportType) {
        case "loan-summary":
          url = "/api/reports/loan-summary";
          filename = "loan_summary.csv";
          break;
        case "collection":
          url = "/api/reports/collection";
          filename = "collection_report.csv";
          break;
        case "outstanding":
          url = "/api/reports/outstanding";
          filename = "outstanding_report.csv";
          break;
        case "emi":
          if (!applicationId) {
            alert("Please enter an application ID");
            setLoading(null);
            return;
          }
          url = `/api/reports/emi/${applicationId}`;
          filename = `emi_schedule_${applicationId}.csv`;
          break;
      }

      const response = await api.get(url, {
        responseType: "blob",
      });

      // Create download link
      const blob = new Blob([response.data], { type: "text/csv" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      alert(`Report downloaded: ${filename}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to download report");
    } finally {
      setLoading(null);
    }
  }

  if (!canViewReports && !canViewEMIReport) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <p className="text-red-600">Access Denied</p>
          <p className="mt-2 text-sm text-gray-500">Only Credit Managers and Super Admins can access reports</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Reports</h1>

        <div className="space-y-4">
          {/* Loan Summary Report */}
          {canViewReports && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">Loan Summary Report</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Overview of all loan applications with customer details, amounts, status, and dates
                  </p>
                </div>
                <button
                  onClick={() => downloadReport("loan-summary")}
                  disabled={loading === "loan-summary"}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === "loan-summary" ? "Downloading..." : "Download CSV"}
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Includes: Application ID, Customer Name, Loan Product, Amount, Interest Rate, Tenure, Status, Created Date
              </div>
            </div>
          )}

          {/* Collection Report */}
          {canViewReports && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">Collection Report</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    All payment collections with EMI details, payment modes, and transaction references
                  </p>
                </div>
                <button
                  onClick={() => downloadReport("collection")}
                  disabled={loading === "collection"}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === "collection" ? "Downloading..." : "Download CSV"}
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Includes: Payment ID, Application ID, Customer Name, EMI Number, Amount, Payment Date, Mode, Transaction ID
              </div>
            </div>
          )}

          {/* Outstanding Report */}
          {canViewReports && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">Outstanding Report</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    All pending and overdue EMIs across all active loans
                  </p>
                </div>
                <button
                  onClick={() => downloadReport("outstanding")}
                  disabled={loading === "outstanding"}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === "outstanding" ? "Downloading..." : "Download CSV"}
                </button>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Includes: Application ID, Customer Name, EMI Number, Due Date, EMI Amount, Outstanding Balance, Status
              </div>
            </div>
          )}

          {/* EMI Schedule Report (Per Application) */}
          {canViewEMIReport && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">EMI Schedule Report</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Complete amortization schedule for a specific loan application
                </p>
              </div>
              
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Application ID
                  </label>
                  <input
                    type="number"
                    value={applicationId}
                    onChange={(e) => setApplicationId(e.target.value)}
                    placeholder="Enter application ID"
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <button
                  onClick={() => downloadReport("emi")}
                  disabled={loading === "emi" || !applicationId}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading === "emi" ? "Downloading..." : "Download CSV"}
                </button>
              </div>
              
              <div className="mt-3 text-xs text-gray-500">
                Includes: EMI Number, Due Date, Principal, Interest, EMI Amount, Outstanding Balance, Status
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <h3 className="mb-2 font-semibold">Report Access Levels:</h3>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Credit Manager & Super Admin:</strong> Can download all reports</li>
            <li><strong>Loan Officer:</strong> Can download EMI schedule reports only</li>
            <li><strong>Customer:</strong> No access to reports section</li>
          </ul>
          <p className="mt-3">All reports are exported in CSV format for easy analysis in Excel or other tools.</p>
        </div>
      </div>
    </AppShell>
  );
}
