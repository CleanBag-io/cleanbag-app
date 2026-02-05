"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label, InputError } from "@/components/ui/input";
import { CITIES } from "@/config/constants";
import { upsertDriver } from "@/lib/driver/actions";

const PLATFORMS = [
  { id: "foody", name: "Foody" },
  { id: "wolt", name: "Wolt" },
  { id: "bolt_food", name: "Bolt Food" },
  { id: "other", name: "Other" },
];

const VEHICLE_TYPES = [
  { id: "motorcycle", name: "Motorcycle / Scooter", icon: "🏍️" },
  { id: "car", name: "Car", icon: "🚗" },
  { id: "bicycle", name: "Bicycle / E-Bike", icon: "🚲" },
];

export default function DriverOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [vehicleType, setVehicleType] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [city, setCity] = useState("");

  const togglePlatform = (platformId: string) => {
    setPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    const formData = new FormData();
    if (vehicleType) formData.append("vehicle_type", vehicleType);
    if (licensePlate) formData.append("license_plate", licensePlate);
    platforms.forEach((p) => formData.append("platforms", p));
    formData.append("city", city);

    const result = await upsertDriver(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/driver/dashboard");
  };

  const canProceedStep1 = vehicleType !== "";
  const canProceedStep2 = platforms.length > 0;
  const canProceedStep3 = city !== "";

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
              {step === 1 && "Your Vehicle"}
              {step === 2 && "Delivery Platforms"}
              {step === 3 && "Your Location"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "What type of vehicle do you use for deliveries?"}
              {step === 2 && "Which platforms do you deliver for?"}
              {step === 3 && "Where are you based in Cyprus?"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Step 1: Vehicle Type */}
            {step === 1 && (
              <div className="space-y-3">
                {VEHICLE_TYPES.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    type="button"
                    onClick={() => setVehicleType(vehicle.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left flex items-center gap-4 transition-all ${
                      vehicleType === vehicle.id
                        ? "border-brand-pink bg-brand-pink-light"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-3xl">{vehicle.icon}</span>
                    <span className="font-medium text-gray-900">
                      {vehicle.name}
                    </span>
                  </button>
                ))}

                {vehicleType && vehicleType !== "bicycle" && (
                  <div className="mt-4">
                    <Label htmlFor="license_plate">License Plate (optional)</Label>
                    <Input
                      id="license_plate"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="e.g., ABC 123"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Platforms */}
            {step === 2 && (
              <div className="space-y-3">
                {PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-all ${
                      platforms.includes(platform.id)
                        ? "border-brand-pink bg-brand-pink-light"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-medium text-gray-900">
                      {platform.name}
                    </span>
                    {platforms.includes(platform.id) && (
                      <span className="text-brand-pink text-xl">✓</span>
                    )}
                  </button>
                ))}
                <p className="text-sm text-gray-500 mt-2">
                  Select all that apply
                </p>
              </div>
            )}

            {/* Step 3: City */}
            {step === 3 && (
              <div className="space-y-4">
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
                      <span className="font-medium">Vehicle:</span>{" "}
                      {VEHICLE_TYPES.find((v) => v.id === vehicleType)?.name}
                    </p>
                    {licensePlate && (
                      <p>
                        <span className="font-medium">License:</span>{" "}
                        {licensePlate}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Platforms:</span>{" "}
                      {platforms
                        .map((p) => PLATFORMS.find((pl) => pl.id === p)?.name)
                        .join(", ")}
                    </p>
                    {city && (
                      <p>
                        <span className="font-medium">City:</span> {city}
                      </p>
                    )}
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
                  disabled={!canProceedStep3 || loading}
                  onClick={handleSubmit}
                >
                  {loading ? "Saving..." : "Complete Setup"}
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
