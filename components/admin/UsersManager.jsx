"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsersManager({ users = [] }) {
  const router = useRouter();
  const [state, setState] = useState({ id: "", message: "" });

  async function update(id, patch) {
    setState({ id, message: "" });
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
        credentials: "same-origin",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update the account.");
      router.refresh();
    } catch (error) {
      setState({ id, message: error.message });
    }
  }

  if (!users.length) {
    return (
      <div className="border border-dashed border-line-dark p-10 text-center">
        <p className="font-display text-2xl">No reader accounts</p>
        <p className="mt-1 text-sm text-ivory/55">Registrations will appear here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-line-dark bg-surface">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-line-dark bg-surface-2/60 text-[10px] uppercase tracking-[0.12em] text-ivory/55">
            <th className="px-4 py-3 font-semibold">Reader</th>
            <th className="px-4 py-3 font-semibold">Role</th>
            <th className="px-4 py-3 font-semibold">Verified</th>
            <th className="px-4 py-3 font-semibold">Joined</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line-dark">
          {users.map((user) => (
            <tr key={user._id} className={user.disabled ? "bg-red-900/10" : ""}>
              <td className="px-4 py-3">
                <p className="font-medium">{user.name}</p>
                <p className="text-[11px] text-ivory/55">{user.email}</p>
                {user.disabled ? <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-400">Disabled</span> : null}
              </td>
              <td className="px-4 py-3 text-xs text-ivory/55">{user.role}</td>
              <td className="px-4 py-3 text-xs">
                <span className={user.emailVerified ? "text-gold" : "text-ivory/55"}>{user.emailVerified ? "Yes" : "No"}</span>
              </td>
              <td className="px-4 py-3 text-xs text-ivory/55">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "â€”"}</td>
              <td className="px-4 py-3 text-right">
                {state.id === user._id && state.message ? <p className="mb-1 text-[11px] text-red-400">{state.message}</p> : null}
                {user.role === "admin" ? (
                  <span className="text-[10px] uppercase tracking-[0.1em] text-ivory/55">Protected</span>
                ) : (
                  <div className="flex justify-end gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                    {!user.emailVerified ? (
                      <button type="button" onClick={() => update(user._id, { emailVerified: true })} className="text-gold">Verify</button>
                    ) : null}
                    <button type="button" onClick={() => update(user._id, { disabled: !user.disabled })} className={user.disabled ? "text-gold" : "text-red-400"}>
                      {user.disabled ? "Enable" : "Disable"}
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

