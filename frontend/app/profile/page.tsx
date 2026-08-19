"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

type CustomerProfile = {
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

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    dob: "",
    pan: "",
    aadhaar: "",
    address: "",
    employment_type: "salaried",
    employer_name: "",
    monthly_income: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_name: "",
  });

  useEffect(() => {
    if (user?.role !== "customer") {
      router.push("/dashboard");
      return;
    }
    fetchProfile();
  }, [user]);

  async function fetchProfile() {
    try {
      const res = await api.get("/api/customers/me");
      setProfile(res.data);
      setHasProfile(true);
      setFormData({
        full_name: res.data.full_name,
        phone: res.data.phone,
        dob: res.data.dob || "",
        pan: res.data.pan,
        aadhaar: res.data.aadhaar,
        address: res.data.address || "",
        employment_type: res.data.employment_type || "salaried",
        employer_name: res.data.employer_name || "",
        monthly_income: res.data.monthly_income || "",
        bank_account_number: res.data.bank_account_number || "",
        bank_ifsc: res.data.bank_ifsc || "",
        bank_name: res.data.bank_name || "",
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHasProfile(false);
      } else {
        setError(err.response?.data?.detail || "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      full_name: formData.full_name,
      phone: formData.phone,
      dob: formData.dob || null,
      pan: formData.pan.toUpperCase(),
      aadhaar: formData.aadhaar,
      address: formData.address || null,
      employment_type: formData.employment_type,
      employer_name: formData.employer_name || null,
      monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
      bank_account_number: formData.bank_account_number || null,
      bank_ifsc: formData.bank_ifsc.toUpperCase() || null,
      bank_name: formData.bank_name || null,
    };

    try {
      if (hasProfile) {
        await api.put("/api/customers/me", payload);
        alert("Profile updated successfully!");
      } else {
        await api.post("/api/customers/", payload);
        alert("Profile created successfully!");
      }
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AppShell><div className="text-center py-12">Loading...</div></AppShell>;

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">
          {hasProfile ? "My Profile" : "Complete Your Profile"}
        </h1>

        {!hasProfile && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            <strong>Complete your profile to apply for loans.</strong> All fields marked with * are required.
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="+919876543210"
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">PAN Number *</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                  required
                  disabled={hasProfile}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 uppercase disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Aadhaar Number *</label>
                <input
                  type="text"
                  value={formData.aadhaar}
                  onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                  required
                  disabled={hasProfile}
                  placeholder="123456789012"
                  maxLength={12}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Employment Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="salaried">Salaried</option>
                  <option value="self_employed">Self Employed</option>
                  <option value="business">Business</option>
                  <option value="professional">Professional</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Employer / Business Name</label>
                <input
                  type="text"
                  value={formData.employer_name}
                  onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Bank Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bank Account Number</label>
                <input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">IFSC Code</label>
                <input
                  type="text"
                  value={formData.bank_ifsc}
                  onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                  maxLength={11}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 uppercase"
                />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Bank Name</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : hasProfile ? "Update Profile" : "Create Profile"}
            </button>
          </div>
        </form>

        {hasProfile && profile && (
          <div className="mt-6 text-xs text-gray-500">
            Profile created on: {new Date(profile.created_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </AppShell>
  );
}
