"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import api from "../../../lib/api";

type LoanProduct = {
  id: number;
  name: string;
  min_amount: string;
  max_amount: string;
  max_tenure: number;
};

export default function NewApplicationPage() {
  const router = useRouter();
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loanProductId, setLoanProductId] = useState("");
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("");
  const [purpose, setPurpose] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [existingEmis, setExistingEmis] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/api/loan-products/").then((res) => setProducts(res.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/loan-applications/", {
        loan_product_id: Number(loanProductId),
        amount: Number(amount),
        tenure: Number(tenure),
        purpose,
        monthly_income: Number(monthlyIncome),
        existing_emis: Number(existingEmis),
      });
      router.push("/applications");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create application");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">New Loan Application</h1>

      <form onSubmit={handleSubmit} className="max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <label className="mb-1 block text-sm font-medium text-gray-700">Loan Product</label>
        <select
          value={loanProductId}
          onChange={(e) => setLoanProductId(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="">Select a product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (₹{p.min_amount} - ₹{p.max_amount}, up to {p.max_tenure} mo)
            </option>
          ))}
        </select>

        <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Tenure (months)</label>
        <input
          type="number"
          value={tenure}
          onChange={(e) => setTenure(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Purpose</label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Income</label>
        <input
          type="number"
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          required
          className="mb-4 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />

        <label className="mb-1 block text-sm font-medium text-gray-700">Existing EMIs</label>
        <input
          type="number"
          value={existingEmis}
          onChange={(e) => setExistingEmis(e.target.value)}
          className="mb-6 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Draft Application"}
        </button>
      </form>
    </AppShell>
  );
}