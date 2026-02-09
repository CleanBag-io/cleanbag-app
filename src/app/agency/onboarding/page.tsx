"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, InputError } from "@/components/ui/input";
import { CITIES } from "@/config/constants";
import { upsertAgency } from "@/lib/agency/actions";

export default function AgencyOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [complianceTarget, setComplianceTarget] = useState(80);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("city", city);
    formData.append("compliance_target", complianceTarget.toString());

    const result = await upsertAgency(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/agency/dashboard");
  };

  const canProceedStep1 = name.trim() !== "";
  const canProceedStep2 = city !== "";

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
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? "bg-brand-pink" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Company Name"}
              {step === 2 && "Location"}
              {step === 3 && "Compliance Target"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "What is your company called?"}
              {step === 2 && "Where is your company based?"}
              {step === 3 && "Set your fleet compliance goal"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Company Name */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" required>
                    Company Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Fast Deliveries Cyprus"
                  />
                </div>

                <div className="p-4 bg-trust-blue-light rounded-lg">
                  <h4 className="font-medium text-trust-blue-dark mb-2">
                    What you get with CleanBag
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>- Monitor your drivers&apos; bag cleanliness</li>
                    <li>- Track fleet compliance in real time</li>
                    <li>- Export compliance reports</li>
                    <li>- Invite and manage drivers</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 2: City */}
            {step === 2 && (
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
            )}

            {/* Step 3: Compliance Target + Summary */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="compliance_target">
                    Compliance Target: {complianceTarget}%
                  </Label>
                  <input
                    id="compliance_target"
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={complianceTarget}
                    onChange={(e) =>
                      setComplianceTarget(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-pink"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Company:</span> {name}
                    </p>
                    <p>
                      <span className="font-medium">City:</span> {city}
                    </p>
                    <p>
                      <span className="font-medium">Compliance Target:</span>{" "}
                      {complianceTarget}%
                    </p>
                  </div>
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
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  Continue
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                <Button
                  fullWidth
                  disabled={loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setStep(2)}
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
