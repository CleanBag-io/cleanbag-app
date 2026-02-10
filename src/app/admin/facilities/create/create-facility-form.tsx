"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { CITIES } from "@/config/constants";
import { createFacilityAccount } from "@/lib/admin/actions";

function generatePassword(length = 10): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export function CreateFacilityForm() {
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await createFacilityAccount({
      email,
      password,
      contactName,
      facilityName,
      address,
      city,
      phone: phone || undefined,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setResult(res.data);
    }
  };

  const handleCreateAnother = () => {
    setResult(null);
    setContactName("");
    setEmail("");
    setPassword("");
    setFacilityName("");
    setAddress("");
    setCity("");
    setPhone("");
    setError("");
  };

  if (result) {
    return (
      <Card className="p-6 max-w-lg">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-green-600 text-xl">&#10003;</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Cleaning Facility Created
          </h2>
          <p className="text-sm text-gray-500">
            Share these credentials with the cleaning facility owner. They should change their password after first login.
          </p>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
            <p className="font-mono text-sm text-gray-900">{result.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Temporary Password</p>
            <p className="font-mono text-sm text-gray-900">{result.tempPassword}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button onClick={handleCreateAnother} variant="secondary">
            Create Another
          </Button>
          <Link href="/admin/facilities">
            <Button variant="primary">Back to Facilities</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="contactName" required>Contact Name</Label>
          <Input
            id="contactName"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Owner or manager name"
            required
          />
        </div>

        <div>
          <Label htmlFor="email" required>Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="facility@example.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="password" required>Temporary Password</Label>
          <div className="flex gap-2">
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPassword(generatePassword())}
              className="shrink-0"
            >
              Generate
            </Button>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div>
          <Label htmlFor="facilityName" required>Cleaning Facility Name</Label>
          <Input
            id="facilityName"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            placeholder="e.g. SparkClean Limassol"
            required
          />
        </div>

        <div>
          <Label htmlFor="address" required>Address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street address"
            required
          />
        </div>

        <div>
          <Label htmlFor="city" required>City</Label>
          <Select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
          >
            <option value="">Select city</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+357..."
          />
        </div>

        {error && (
          <p className="text-sm text-status-overdue">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={loading} fullWidth>
            {loading ? "Creating..." : "Create Cleaning Facility"}
          </Button>
        </div>

        <div className="text-center">
          <Link href="/admin/facilities" className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
