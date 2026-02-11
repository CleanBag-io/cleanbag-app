interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Geocode an address + city to lat/lng using Google Geocoding API.
 * Returns null on failure (graceful degradation).
 */
export async function geocodeAddress(
  address: string,
  city: string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const fullAddress = `${address}, ${city}, Cyprus`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("Geocoding request failed:", res.status);
      return null;
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) {
      console.error("Geocoding returned no results for:", fullAddress, data.status);
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch (err) {
    console.error("Geocoding error:", err);
    return null;
  }
}
