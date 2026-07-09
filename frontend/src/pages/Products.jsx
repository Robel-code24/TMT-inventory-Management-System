import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  unit_price: "",
  quantity_in_stock: "0",
  reorder_level: "10",
  category_id: "",
  supplier_id: "",
};

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 10 };
      if (search) params.search = search;
      if (categoryFilter) params.category_id = categoryFilter;
      if (lowStockOnly) params.low_stock = true;

      const data = await api.getProducts(params);
      setProducts(data.items);
      setTotalPages(data.total_pages);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
    api.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, search, categoryFilter, lowStockOnly]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      unit_price: String(product.unit_price),
      quantity_in_stock: String(product.quantity_in_stock),
      reorder_level: String(product.reorder_level),
      category_id: product.category_id ? String(product.category_id) : "",
      supplier_id: product.supplier_id ? String(product.supplier_id) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      sku: form.sku,
      description: form.description || null,
      unit_price: parseFloat(form.unit_price),
      reorder_level: parseInt(form.reorder_level, 10),
      category_id: form.category_id ? parseInt(form.category_id, 10) : null,
      supplier_id: form.supplier_id ? parseInt(form.supplier_id, 10) : null,
    };

    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
      } else {
        payload.quantity_in_stock = parseInt(form.quantity_in_stock, 10);
        await api.createProduct(payload);
      }
      setShowModal(false);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Products</h1>
          <p className="text-sm text-slate-500">Manage your product inventory</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark">
            + Add Product
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          placeholder="Search by name or SKU..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }} />
          Low stock only
        </label>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" message="Add your first product to get started." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Supplier</th>
                {isAdmin && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className={p.is_low_stock ? "bg-red-50" : ""}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">{p.category_name || "—"}</td>
                  <td className="px-4 py-3">UGX {p.unit_price.toLocaleString()}</td>
                  <td className={`px-4 py-3 font-semibold ${p.is_low_stock ? "text-red-600" : ""}`}>
                    {p.quantity_in_stock}
                    {p.is_low_stock && <span className="ml-1 text-xs">⚠ Low</span>}
                  </td>
                  <td className="px-4 py-3">{p.supplier_name || "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(p)} className="mr-2 text-accent hover:underline">Edit</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40">Prev</button>
          <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold">{editing ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {["name", "sku", "description", "unit_price", "quantity_in_stock", "reorder_level"].map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm capitalize">{field.replace(/_/g, " ")}</label>
                  <input
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    required={field !== "description" && !(editing && field === "quantity_in_stock")}
                    disabled={editing && field === "quantity_in_stock"}
                    className="w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm">Category</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">None</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm">Supplier</label>
                <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="">None</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 rounded-lg bg-accent py-2 text-white">Save</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg border py-2">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
