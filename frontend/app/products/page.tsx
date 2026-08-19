"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import api from "../../lib/api";
import { useAuth } from "../../lib/auth";

type LoanProduct = {
  id: number;
  name: string;
  min_amount: string;
  max_amount: string;
  interest_rate: string;
  max_tenure: number;
  processing_fee: string;
  created_at: string;
};

export default function ProductsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    min_amount: "",
    max_amount: "",
    interest_rate: "",
    max_tenure: "",
    processing_fee: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await api.get("/api/loan-products/");
      setProducts(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(product: LoanProduct) {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      min_amount: product.min_amount,
      max_amount: product.max_amount,
      interest_rate: product.interest_rate,
      max_tenure: product.max_tenure.toString(),
      processing_fee: product.processing_fee,
    });
    setShowForm(true);
  }

  function handleNew() {
    setEditingId(null);
    setFormData({
      name: "",
      min_amount: "",
      max_amount: "",
      interest_rate: "",
      max_tenure: "",
      processing_fee: "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);

    const payload = {
      name: formData.name,
      min_amount: parseFloat(formData.min_amount),
      max_amount: parseFloat(formData.max_amount),
      interest_rate: parseFloat(formData.interest_rate),
      max_tenure: parseInt(formData.max_tenure),
      processing_fee: parseFloat(formData.processing_fee),
    };

    try {
      if (editingId) {
        await api.put(`/api/loan-products/${editingId}`, payload);
        alert("Product updated successfully!");
      } else {
        await api.post("/api/loan-products/", payload);
        alert("Product created successfully!");
      }
      setShowForm(false);
      await fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to save product");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete product "${name}"? This cannot be undone.`)) return;

    try {
      await api.delete(`/api/loan-products/${id}`);
      alert("Product deleted successfully!");
      await fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete product");
    }
  }

  if (loading) return <AppShell><div className="text-center py-12">Loading...</div></AppShell>;
  if (error) return <AppShell><div className="text-red-600 py-12">{error}</div></AppShell>;

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Loan Products</h1>
        {isSuperAdmin && !showForm && (
          <button
            onClick={handleNew}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Product
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && isSuperAdmin && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? "Edit Product" : "Create New Product"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Min Amount (₹)</label>
              <input
                type="number"
                value={formData.min_amount}
                onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Amount (₹)</label>
              <input
                type="number"
                value={formData.max_amount}
                onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Interest Rate (%)</label>
              <input
                type="number"
                value={formData.interest_rate}
                onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                required
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Max Tenure (months)</label>
              <input
                type="number"
                value={formData.max_tenure}
                onChange={(e) => setFormData({ ...formData, max_tenure: e.target.value })}
                required
                min="1"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Processing Fee (%)</label>
              <input
                type="number"
                value={formData.processing_fee}
                onChange={(e) => setFormData({ ...formData, processing_fee: e.target.value })}
                required
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {formLoading ? "Saving..." : editingId ? "Update Product" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">No loan products available</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-xs text-gray-500">ID: {product.id}</p>
                </div>
                {isSuperAdmin && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Amount Range:</span>
                  <div className="font-medium text-gray-900">
                    ₹{parseFloat(product.min_amount).toLocaleString()} - ₹{parseFloat(product.max_amount).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Interest Rate:</span>
                  <div className="font-medium text-gray-900">{product.interest_rate}% per annum</div>
                </div>
                <div>
                  <span className="text-gray-500">Max Tenure:</span>
                  <div className="font-medium text-gray-900">{product.max_tenure} months</div>
                </div>
                <div>
                  <span className="text-gray-500">Processing Fee:</span>
                  <div className="font-medium text-gray-900">{product.processing_fee}%</div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Created:</span>
                  <div className="font-medium text-gray-900">
                    {new Date(product.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isSuperAdmin && (
        <div className="mt-4 text-sm text-gray-500">
          Note: Only Super Admins can create, edit, or delete loan products.
        </div>
      )}
    </AppShell>
  );
}
