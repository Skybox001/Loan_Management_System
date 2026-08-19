"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

type Customer = {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  dob: string | null;
  pan: string;
  aadhaar: string;
  address: string | null;
  employment_type: string | null;
  employer_name: string | null;
  monthly_income: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_name: string | null;
  created_at: string;
};

export default function CustomersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Redirect if customer tries to access
    if (user?.role === "customer") {
      router.push("/dashboard");
      return;
    }
    fetchCustomers();
  }, [user]);

  async function fetchCustomers() {
    try {
      const res = await api.get("/api/customers/", {
        params: { search: search || undefined },
      });
      setCustomers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    fetchCustomers();
  }

  if (loading) return <AppShell><div className="text-center py-12">Loading...</div></AppShell>;
  if (error) return <AppShell><div className="text-red-600 py-12">{error}</div></AppShell>;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or PAN..."
          className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900"
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {/* Customers Table */}
      {customers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No customers found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">PAN</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Employment</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Monthly Income</th>
                <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{customer.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{customer.full_name}</td>
                  <td className="px-4 py-3 text-gray-900">{customer.phone}</td>
                  <td className="px-4 py-3 text-gray-900">{customer.pan}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {customer.employment_type?.replace("_", " ") || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {customer.monthly_income ? `₹${parseFloat(customer.monthly_income).toLocaleString()}` : "N/A"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => router.push(`/customers/${customer.id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total: {customers.length} customer{customers.length !== 1 ? "s" : ""}
      </div>
    </AppShell>
  );
}
