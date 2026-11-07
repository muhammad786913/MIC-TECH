"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EMPTY = { name: "", slug: "", description: "", order: 50, hidden: false };

export default function CategoryManager({ categories = [] }) {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [state, setState] = useState({ status: "idle", message: "" });

  function edit(category) {
    setEditing(category._id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      order: category.order || 50,
      hidden: Boolean(category.hidden),
    });
  }

  function reset() {
    setEditing(null);
    setForm(EMPTY);
    setState({ status: "idle", message: "" });
  }

  async function submit(event) {
    event.preventDefault();
    setState({ status: "saving", message: "" });
    try {
      const response = await fetch(editing ? `/api/admin/categories/${editing}` : "/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, order: Number(form.order) || 50 }),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the category.");
      setState({ status: "done", message: editing ? "Category updated." : "Category created." });
      reset();
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  async function remove(category) {
    if (!window.confirm(`Delete "${category.name}"? Only empty categories can be deleted.`)) return;
    setState({ status: "saving", message: "" });
    try {
      const response = await fetch(`/api/admin/categories/${category._id}`, { method: "DELETE", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not delete the category.");
      setState({ status: "done", message: "Category deleted." });
      router.refresh();
    } catch (error) {
      setState({ status: "error", message: error.message });
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-x-auto border border-line-dark bg-surface">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-line-dark bg-surface-2/60 text-[10px] uppercase tracking-[0.12em] text-ivory/55">
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Articles</th>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-dark">
            {categories.map((category) => (
              <tr key={category._id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{category.name}</p>
                  {category.hidden ? <span className="text-[9px] uppercase tracking-[0.1em] text-ivory/55">Hidden</span> : null}
                </td>
                <td className="px-4 py-3 text-xs text-ivory/55">/{category.slug}</td>
                <td className="px-4 py-3 text-xs text-ivory/55">{category.publishedCount || 0} / {category.totalCount || 0}</td>
                <td className="px-4 py-3 text-xs text-ivory/55">{category.order}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                    <button type="button" onClick={() => edit(category)} className="text-gold">Edit</button>
                    <button type="button" onClick={() => remove(category)} className="text-red-400">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={submit} className="h-fit border border-line-dark bg-surface p-5">
        <h2 className="font-display text-xl">{editing ? "Edit category" : "New category"}</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="category-name" className="field-label">Name</label>
            <input id="category-name" className="input" required minLength={2} maxLength={60} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div>
            <label htmlFor="category-slug" className="field-label">Slug (optional)</label>
            <input id="category-slug" className="input" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="auto-generated" />
          </div>
          <div>
            <label htmlFor="category-description" className="field-label">Description</label>
            <textarea id="category-description" className="input min-h-[64px]" maxLength={300} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category-order" className="field-label">Order</label>
              <input id="category-order" type="number" min={0} max={999} className="input" value={form.order} onChange={(event) => setForm({ ...form, order: event.target.value })} />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-ivory/70">
              <input type="checkbox" checked={form.hidden} onChange={(event) => setForm({ ...form, hidden: event.target.checked })} className="h-4 w-4 accent-[#C5A24B]" />
              Hidden
            </label>
          </div>
          {state.message ? (
            <p role="status" className={`border p-2.5 text-xs ${state.status === "error" ? "border-red-500/30 bg-red-900/10 text-red-400" : "border-gold/40 bg-surface-2/60 text-ivory/70"}`}>{state.message}</p>
          ) : null}
          <div className="flex gap-2">
            <button type="submit" disabled={state.status === "saving"} className="btn-gold disabled:opacity-60">
              {state.status === "saving" ? "Savingâ€¦" : editing ? "Save changes" : "Create category"}
            </button>
            {editing ? <button type="button" onClick={reset} className="btn-outline">Cancel</button> : null}
          </div>
        </div>
      </form>
    </div>
  );
}

