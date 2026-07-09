import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function Categories() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await api.getCategories());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.updateCategory(editing.id, form);
      } else {
        await api.createCategory(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.deleteCategory(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Categories</h1>
          <p className="text-sm text-slate-500">Organize products by category</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setForm({ name: "", description: "" }); setShowModal(true); }} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            + Add Category
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {loading ? <LoadingSpinner /> : categories.length === 0 ? (
        <EmptyState title="No categories" message="Create categories to organize products." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-navy">{c.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{c.description || "No description"}</p>
              {isAdmin && (
                <div className="mt-4 flex gap-3 text-sm">
                  <button onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || "" }); setShowModal(true); }} className="text-accent hover:underline">Edit</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline">Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold">{editing ? "Edit Category" : "Add Category"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-sm">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" rows={3} />
              </div>
              <div className="flex gap-3">
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
