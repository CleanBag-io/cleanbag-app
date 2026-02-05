"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, InputError } from "@/components/ui/input";
import { CITIES } from "@/config/constants";
import { createFacility } from "@/lib/facility/actions";

export default function FacilityOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("address", address);
    formData.append("city", city);
    if (phone) formData.append("phone", phone);

    const result = await createFacility(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/facility/dashboard");
  };

  const canProceedStep1 = name.trim() !== "";
  const canProceedStep2 = address.trim() !== "" && city !== "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <Image src="/logo.svg" alt="CleanBag" width={48} height={48} />
          <span className="text-xl font-bold text-brand-pink">CleanBag</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-24 rounded-full transition-colors ${
                s <= step ? "bg-brand-pink" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Facility Details"}
              {step === 2 && "Location"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your cleaning facility"}
              {step === 2 && "Where is your facility located?"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Facility Name & Phone */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" required>
                    Facility Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., CleanBag Nicosia Center"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+357 22 123456"
                  />
                </div>

                <div className="p-4 bg-trust-blue-light rounded-lg">
                  <h4 className="font-medium text-trust-blue-dark mb-2">
                    What you get with CleanBag
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>- Access to delivery drivers in your area</li>
                    <li>- Easy order management dashboard</li>
                    <li>- Automatic revenue tracking</li>
                    <li>- 15% commission on completed orders</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: Address & City */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address" required>
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 123 Main Street"
                  />
                </div>

                <div>
                  <Label htmlFor="city" required>
                    City
                  </Label>
                  <Select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    <option value="">Select your city</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Name:</span> {name}
                    </p>
                    {phone && (
                      <p>
                        <span className="font-medium">Phone:</span> {phone}
                      </p>
                    )}
                    {address && (
                      <p>
                        <span className="font-medium">Address:</span> {address}
                      </p>
                    )}
                    {city && (
                      <p>
                        <span className="font-medium">City:</span> {city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-brand-pink-light rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Default services:</span> Standard, Express, and Deep Clean will be enabled at standard prices. Contact support to customize.
                  </p>
                </div>
              </div>
            )}

            {error && <InputError className="mt-4">{error}</InputError>}
          </CardContent>

          <CardFooter className="flex-col gap-3">
            {step === 1 && (
              <Button
                fullWidth
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            )}

            {step === 2 && (
              <>
                <Button
                  fullWidth
                  disabled={!canProceedStep2 || loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Creating Facility..." : "Complete Setup"}
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
