"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, InputError } from "@/components/ui/input";
import { updateProfile } from "@/lib/auth/actions";
import type { Profile } from "@/types";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("phone", phone);

    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setEditing(false);
    router.refresh();
  };

  const handleCancel = () => {
    setFullName(profile.full_name);
    setPhone(profile.phone || "");
    setEditing(false);
    setError(null);
  };

  if (!editing) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Full Name</span>
          <span className="font-medium">{profile.full_name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">Phone</span>
          <span className="font-medium">{profile.phone || "Not set"}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Role</span>
          <span className="font-medium capitalize">{profile.role}</span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
          Edit Profile
        </Button>
        {success && (
          <p className="text-sm text-green-600">Profile updated successfully!</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name" required>
          Full Name
        </Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+357 99 123456"
        />
      </div>

      {error && <InputError>{error}</InputError>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
