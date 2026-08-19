"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

type EMI = {
  id: number;
  loan_application_id: number;
  emi_number: number;
  due_date: string;
  emi_amount: string;
  outstanding_balance: string;
  status: string;
};

type Application = {
  id: number;
  customer_id: number;
  amount: string;
  status: string;
};

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [emis, setEmis] = useState<EMI[]>([]);
  const [selectedEmiId, setSelectedEmiId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isStaff = user?.role && ["loan_officer", "credit_manager", "super_admin"].includes(user.role);

  useEffect(() => {
    if (!isStaff) {
      router.push("/dashboard");
      return;
    }
    fetchApplications();
  }, [user]);

  async function fetchApplications() {
    try {
      const res = await api.get("/api/loan-applications/");
      // Only disbursed applications have active EMIs
      const disbursed = res.data.filter(
        (app: Application) => app.status === "disbursed"
      );
      setApplications(disbursed);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load applications");
    }
  }

  async function fetchEMIs(appId: string) {
    try {
      const res = await api.get(`/api/emi-schedule/${appId}`);
      // Only show pending or overdue EMIs
      const unpaid = res.data.filter(
        (emi: EMI) => emi.status === "pending" || emi.status === "overdue"
      );
      setEmis(unpaid);
      setSelectedEmiId("");
      setAmount("");
    } catch (err) {
      console.error("Failed to fetch EMIs", err);
      setEmis([]);
    }
  }

  function handleApplicationChange(appId: string) {
    setSelectedAppId(appId);
    if (appId) {
      fetchEMIs(appId);
    } else {
      setEmis([]);
      setSelectedEmiId("");
      setAmount("");
    }
  }

  function handleEmiChange(emiId: string) {
    setSelectedEmiId(emiId);
    const emi = emis.find((e) => e.id.toString() === emiId);
    if (emi) {
      setAmount(emi.emi_amount);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmiId || !amount || !transactionId.trim()) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/api/payments/", {
        emi_id: parseInt(selectedEmiId),
        amount: parseFloat(amount),
        payment_mode: paymentMode,
        transaction_id: transactionId,
      });

      alert("Payment recorded successfully!");
      
      // Reset form
      setSelectedEmiId("");
      setAmount("");
      setTransactionId("");
      
      // Refresh EMI list
      if (selectedAppId) {
        await fetchEMIs(selectedAppId);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }

  if (!isStaff) {
    return <AppShell><div className="text-center py-12">Access denied</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Record Payment</h1>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Select Application */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Select Loan Application
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => handleApplicationChange(e.target.value)}
                required
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Choose an application...</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    Application #{app.id} - ₹{parseFloat(app.amount).toLocaleString()} (Customer ID: {app.customer_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Select EMI */}
            {selectedAppId && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select EMI to Pay
                </label>
                {emis.length === 0 ? (
                  <p className="text-sm text-gray-500">No pending EMIs for this application</p>
                ) : (
                  <select
                    value={selectedEmiId}
                    onChange={(e) => handleEmiChange(e.target.value)}
                    required
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="">Choose an EMI...</option>
                    {emis.map((emi) => (
                      <option key={emi.id} value={emi.id}>
                        EMI #{emi.emi_number} - ₹{parseFloat(emi.emi_amount).toLocaleString()} (Due: {new Date(emi.due_date).toLocaleDateString()}) - {emi.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Amount */}
            {selectedEmiId && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                    step="0.01"
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Default is the EMI amount. You can enter a different amount if needed.
                  </p>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    required
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Transaction ID / Reference Number
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                    placeholder="e.g., TXN123456789 or cheque number"
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAppId("");
                      setEmis([]);
                      setSelectedEmiId("");
                      setAmount("");
                      setTransactionId("");
                      setError("");
                    }}
                    className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <h3 className="mb-2 font-semibold">Payment Recording Instructions:</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Only staff members (Loan Officer, Credit Manager, Super Admin) can record payments</li>
            <li>Only disbursed loans with pending EMIs are shown</li>
            <li>The system will automatically mark the EMI as paid when payment equals EMI amount</li>
            <li>If all EMIs are paid, the loan status will change to "Closed"</li>
            <li>Transaction ID must be unique for each payment</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
