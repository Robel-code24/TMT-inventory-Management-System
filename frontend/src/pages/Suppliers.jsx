import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const emptyForm = { name: "", contact_person: "", email: "", phone: "", address: "" };

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      setSuppliers(await api.getSuppliers());
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
        await api.updateSupplier(editing.id, form);
      } else {
        await api.createSupplier(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this supplier?")) return;
    try {
      await api.deleteSupplier(id);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Suppliers</h1>
          <p className="text-sm text-slate-500">Manage supplier contacts</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white">
            + Add Supplier
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {loading ? <LoadingSpinner /> : suppliers.length === 0 ? (
        <EmptyState title="No suppliers" message="Add suppliers to link with products." />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                {isAdmin && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.contact_person || "—"}</td>
                  <td className="px-4 py-3">{s.email || "—"}</td>
                  <td className="px-4 py-3">{s.phone || "—"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button onClick={() => { setEditing(s); setForm({ name: s.name, contact_person: s.contact_person || "", email: s.email || "", phone: s.phone || "", address: s.address || "" }); setShowModal(true); }} className="mr-2 text-accent hover:underline">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h2 className="text-lg font-bold">{editing ? "Edit Supplier" : "Add Supplier"}</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {Object.keys(emptyForm).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm capitalize">{field.replace(/_/g, " ")}</label>
                  <input
                    required={field === "name"}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              ))}
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
