"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "../../../components/AppShell";
import api from "../../../lib/api";
import { useAuth } from "../../../lib/auth";

type Application = {
  id: number;
  customer_id: number;
  loan_product_id: number;
  amount: string;
  interest_rate: string;
  tenure: number;
  purpose: string | null;
  monthly_income: string;
  existing_emis: string;
  status: string;
  reviewed_by: number | null;
  approved_by: number | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

type Document = {
  id: number;
  loan_application_id: number;
  document_type: string;
  file_path: string;
  file_size_kb: number;
  status: string;
  verified_by: number | null;
  remarks: string | null;
  uploaded_at: string;
};

type EMI = {
  id: number;
  loan_application_id: number;
  emi_number: number;
  due_date: string;
  principal: string;
  interest: string;
  emi_amount: string;
  outstanding_balance: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-yellow-100 text-yellow-700",
  document_verification: "bg-purple-100 text-purple-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-teal-100 text-teal-700",
  closed: "bg-gray-100 text-gray-700",
};

const TRANSITIONS: Record<string, Record<string, string[]>> = {
  submitted: {
    under_review: ["loan_officer", "super_admin"],
    rejected: ["loan_officer", "super_admin"],
  },
  under_review: {
    document_verification: ["loan_officer", "super_admin"],
    rejected: ["loan_officer", "super_admin"],
  },
  document_verification: {
    approved: ["credit_manager", "super_admin"],
    rejected: ["credit_manager", "super_admin"],
  },
  approved: {
    disbursed: ["credit_manager", "super_admin"],
  },
  disbursed: {
    closed: ["credit_manager", "super_admin"],
  },
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [emis, setEmis] = useState<EMI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("pan_card");

  const applicationId = params.id as string;

  useEffect(() => {
    fetchApplication();
    fetchDocuments();
  }, [applicationId]);

  async function fetchApplication() {
    try {
      const res = await api.get(`/api/loan-applications/${applicationId}`);
      setApplication(res.data);
      
      // Fetch EMI schedule if approved or later
      if (["approved", "disbursed", "closed"].includes(res.data.status)) {
        fetchEMISchedule();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load application");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments() {
    try {
      const res = await api.get(`/api/documents/${applicationId}`);
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  }

  async function fetchEMISchedule() {
    try {
      const res = await api.get(`/api/emi-schedule/${applicationId}`);
      setEmis(res.data);
    } catch (err) {
      console.error("Failed to fetch EMI schedule", err);
    }
  }

  async function handleSubmit() {
    if (!confirm("Submit this application for review?")) return;
    setActionLoading(true);
    try {
      await api.post(`/api/loan-applications/${applicationId}/submit`);
      await fetchApplication();
      alert("Application submitted successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange() {
    if (!newStatus) return;
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      alert("Rejection reason is required");
      return;
    }
    if (!confirm(`Change status to ${newStatus.replace("_", " ")}?`)) return;

    setActionLoading(true);
    try {
      await api.patch(`/api/loan-applications/${applicationId}/status`, {
        status: newStatus,
        rejection_reason: newStatus === "rejected" ? rejectionReason : null,
      });
      await fetchApplication();
      setNewStatus("");
      setRejectionReason("");
      alert("Status updated successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpload() {
    if (!uploadFile) {
      alert("Please select a file");
      return;
    }
    
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("document_type", documentType);

    setActionLoading(true);
    try {
      await api.post(`/api/documents/${applicationId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchDocuments();
      setUploadFile(null);
      alert("Document uploaded successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to upload document");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyDocument(docId: number, status: string, remarks: string) {
    setActionLoading(true);
    try {
      await api.patch(`/api/documents/${docId}/verify`, { status, remarks });
      await fetchDocuments();
      alert("Document verification updated!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to verify document");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <AppShell><div className="text-center py-12">Loading...</div></AppShell>;
  if (error) return <AppShell><div className="text-red-600 py-12">{error}</div></AppShell>;
  if (!application) return <AppShell><div className="text-center py-12">Application not found</div></AppShell>;

  const isCustomer = user?.role === "customer";
  const canSubmit = isCustomer && application.status === "draft";
  const allowedTransitions = TRANSITIONS[application.status] || {};
  const canChangeStatus = !isCustomer && Object.keys(allowedTransitions).some(
    (targetStatus) => allowedTransitions[targetStatus].includes(user?.role || "")
  );

  return (
    <AppShell>
      <div className="max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Application #{application.id}
          </h1>
          <span className={`rounded px-3 py-1 text-sm font-medium ${STATUS_COLORS[application.status]}`}>
            {application.status.replace("_", " ").toUpperCase()}
          </span>
        </div>

        {/* Application Details */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Loan Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-2 font-medium text-gray-900">₹{parseFloat(application.amount).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Interest Rate:</span>
              <span className="ml-2 font-medium text-gray-900">{application.interest_rate}%</span>
            </div>
            <div>
              <span className="text-gray-500">Tenure:</span>
              <span className="ml-2 font-medium text-gray-900">{application.tenure} months</span>
            </div>
            <div>
              <span className="text-gray-500">Monthly Income:</span>
              <span className="ml-2 font-medium text-gray-900">₹{parseFloat(application.monthly_income).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Existing EMIs:</span>
              <span className="ml-2 font-medium text-gray-900">₹{parseFloat(application.existing_emis).toLocaleString()}</span>
            </div>
            {application.purpose && (
              <div className="col-span-2">
                <span className="text-gray-500">Purpose:</span>
                <span className="ml-2 font-medium text-gray-900">{application.purpose}</span>
              </div>
            )}
            {application.rejection_reason && (
              <div className="col-span-2">
                <span className="text-red-600">Rejection Reason:</span>
                <span className="ml-2 font-medium text-red-700">{application.rejection_reason}</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button for Customer */}
        {canSubmit && (
          <div className="mb-6">
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        )}

        {/* Status Change for Staff */}
        {canChangeStatus && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Change Status</h2>
            <div className="flex items-start gap-4">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Select new status</option>
                {Object.entries(allowedTransitions).map(([status, roles]) =>
                  roles.includes(user?.role || "") ? (
                    <option key={status} value={status}>
                      {status.replace("_", " ").toUpperCase()}
                    </option>
                  ) : null
                )}
              </select>

              {newStatus === "rejected" && (
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (required)"
                  className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              )}

              <button
                onClick={handleStatusChange}
                disabled={!newStatus || actionLoading}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        )}

        {/* Document Upload */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Documents</h2>
          
          {/* Upload Form */}
          <div className="mb-6 flex items-end gap-4 rounded bg-gray-50 p-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="pan">PAN Card</option>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="salary_slip">Salary Slip</option>
                <option value="bank_statement">Bank Statement</option>
                <option value="form_16">Form 16</option>
                <option value="photograph">Photograph</option>
                <option value="address_proof">Address Proof</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">File (Max 10MB, PDF/JPG/PNG)</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={!uploadFile || actionLoading}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Upload
            </button>
          </div>

          {/* Documents List */}
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">No documents uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {doc.document_type.replace("_", " ").toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {doc.file_size_kb}KB • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                    {doc.remarks && <div className="text-xs text-gray-600 mt-1">Remarks: {doc.remarks}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded px-2 py-1 text-xs font-medium ${
                      doc.status === "verified" ? "bg-green-100 text-green-700" :
                      doc.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {doc.status}
                    </span>
                    {!isCustomer && doc.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const remarks = prompt("Remarks (optional):");
                            if (remarks !== null) handleVerifyDocument(doc.id, "verified", remarks);
                          }}
                          className="text-xs text-green-600 hover:underline"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => {
                            const remarks = prompt("Rejection remarks:");
                            if (remarks) handleVerifyDocument(doc.id, "rejected", remarks);
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EMI Schedule */}
        {emis.length > 0 && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">EMI Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Due Date</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Principal</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Interest</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">EMI Amount</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Balance</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {emis.map((emi) => (
                    <tr key={emi.id}>
                      <td className="px-3 py-2 text-gray-900">{emi.emi_number}</td>
                      <td className="px-3 py-2 text-gray-900">{new Date(emi.due_date).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right text-gray-900">₹{parseFloat(emi.principal).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-900">₹{parseFloat(emi.interest).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">₹{parseFloat(emi.emi_amount).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-900">₹{parseFloat(emi.outstanding_balance).toLocaleString()}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`rounded px-2 py-1 text-xs font-medium ${
                          emi.status === "paid" ? "bg-green-100 text-green-700" :
                          emi.status === "overdue" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>
                          {emi.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
