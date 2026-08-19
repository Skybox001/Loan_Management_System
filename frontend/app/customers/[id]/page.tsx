"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "../../../components/AppShell";
import api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

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

type LoanApplication = {
  id: number;
  customer_id: number;
  amount: string;
  status: string;
  created_at: string;
  loan_product_id: number;
};


export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const customerId = params.id as string;

  useEffect(() => {
    // Redirect if customer tries to access
    if (user?.role === "customer") {
      router.push("/dashboard");
      return;
    }
    fetchCustomer();
    fetchApplications();
  }, [customerId, user]);

  async function fetchCustomer() {
    try {
      const res = await api.get(`/api/customers/${customerId}`);
      setCustomer(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
    try {
      const res = await api.get("/api/loan-applications/");
      // Filter applications for this customer
      const customerApps = res.data.filter(
        (app: LoanApplication) => app.customer_id === parseInt(customerId)
      );
      setApplications(customerApps);
    } catch (err) {
      console.error("Failed to fetch applications", err);
    }
  }

  if (loading) return <AppShell><div className="text-center py-12">Loading...</div></AppShell>;
  if (error) return <AppShell><div className="text-red-600 py-12">{error}</div></AppShell>;
  if (!customer) return <AppShell><div className="text-center py-12">Customer not found</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Customer Details</h1>
          <button
            onClick={() => router.push("/customers")}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Customers
          </button>
        </div>

        {/* Personal Information */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Customer ID:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.id}</span>
            </div>
            <div>
              <span className="text-gray-500">User ID:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.user_id}</span>
            </div>
            <div>
              <span className="text-gray-500">Full Name:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.full_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.phone}</span>
            </div>
            <div>
              <span className="text-gray-500">Date of Birth:</span>
              <span className="ml-2 font-medium text-gray-900">
                {customer.dob ? new Date(customer.dob).toLocaleDateString() : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">PAN:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.pan}</span>
            </div>
            <div>
              <span className="text-gray-500">Aadhaar:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.aadhaar}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Address:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.address || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Employment & Financial */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Employment & Financial Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Employment Type:</span>
              <span className="ml-2 font-medium text-gray-900">
                {customer.employment_type?.replace("_", " ").toUpperCase() || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Employer Name:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.employer_name || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">Monthly Income:</span>
              <span className="ml-2 font-medium text-gray-900">
                {customer.monthly_income ? `₹${parseFloat(customer.monthly_income).toLocaleString()}` : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Bank Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Account Number:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.bank_account_number || "N/A"}</span>
            </div>
            <div>
              <span className="text-gray-500">IFSC Code:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.bank_ifsc || "N/A"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Bank Name:</span>
              <span className="ml-2 font-medium text-gray-900">{customer.bank_name || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Loan Applications */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Loan Applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">No loan applications yet</p>
          ) : (
            <div className="overflow-hidden rounded border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">ID</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Created</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900">{app.id}</td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        ₹{parseFloat(app.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {app.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => router.push(`/applications/${app.id}`)}
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
        </div>

        <div className="text-xs text-gray-500">
          Customer since: {new Date(customer.created_at).toLocaleDateString()}
        </div>
      </div>
    </AppShell>
  );
}
