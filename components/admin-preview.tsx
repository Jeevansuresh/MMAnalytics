"use client";
import { useState } from "react";
import type { Role } from "@/lib/api/types";
import { useApp } from "./app-provider";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Icon } from "./icon";
export function AdminPreview({ onClose }: { onClose: () => void }) {
  const { session } = useApp();
  const [users, setUsers] = useState(session.managedUsers);
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<Role>("campus_lead");
  const [campus, setCampus] = useState("christ");
  return (
    <div className="modal-backdrop">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-title"
        className="admin-dialog"
      >
        <div className="flex items-center justify-between">
          <h2 id="admin-title">Manage workspace users</h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close user management"
            onClick={onClose}
          >
            <Icon name="close" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground my-3">
          Local UI preview. Changes reset when closed; no invitations or
          accounts are created.
        </p>
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!label.trim()) return;
            setUsers([
              ...users,
              {
                id: `local-${Date.now()}`,
                label: label.trim(),
                role,
                campusId: role === "campus_lead" ? campus : null,
                enabled: true,
              },
            ]);
            setLabel("");
          }}
        >
          <Input
            aria-label="Account label"
            placeholder="Team or account label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <select
            aria-label="New user role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="campus_lead">Campus lead</option>
            <option value="admin">Admin</option>
            <option value="ceo">CEO</option>
          </select>
          {role === "campus_lead" && (
            <Input
              aria-label="Assigned campus ID"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              required
            />
          )}
          <Button type="submit">Add preview user</Button>
        </form>
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div className="staff-row" key={user.id}>
              <div>
                <strong>{user.label}</strong>
                <p>
                  {user.role}
                  {user.campusId ? ` · ${user.campusId}` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setUsers(
                    users.map((u) =>
                      u.id === user.id ? { ...u, enabled: !u.enabled } : u,
                    ),
                  )
                }
              >
                {user.enabled ? "Disable" : "Enable"}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
