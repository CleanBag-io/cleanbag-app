"use client";

import { useState, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import Link from "next/link";
import { MAP_CONFIG } from "@/config/constants";
import type { Facility } from "@/types";

interface FacilityMapProps {
  facilities: Facility[];
  singleFacility?: boolean;
  height?: string;
  fallback?: React.ReactNode;
}

export function FacilityMap({
  facilities,
  singleFacility = false,
  height = "12rem",
  fallback,
}: FacilityMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Filter to only facilities with coordinates
  const geocoded = facilities.filter(
    (f) => f.latitude != null && f.longitude != null
  );

  // Show fallback if no API key or no geocoded facilities
  if (!apiKey || geocoded.length === 0) {
    return <>{fallback}</>;
  }

  const center = singleFacility && geocoded[0]
    ? { lat: geocoded[0].latitude!, lng: geocoded[0].longitude! }
    : MAP_CONFIG.defaultCenter;

  const zoom = singleFacility ? 15 : MAP_CONFIG.defaultZoom;

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="facility-map"
          gestureHandling="cooperative"
          disableDefaultUI={singleFacility}
          style={{ width: "100%", height: "100%" }}
        >
          {geocoded.map((facility) => (
            <FacilityMarker
              key={facility.id}
              facility={facility}
              showInfoWindow={!singleFacility}
            />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}

function FacilityMarker({
  facility,
  showInfoWindow,
}: {
  facility: Facility;
  showInfoWindow: boolean;
}) {
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(() => {
    if (showInfoWindow) {
      setOpen((prev) => !prev);
    }
  }, [showInfoWindow]);

  return (
    <AdvancedMarker
      position={{ lat: facility.latitude!, lng: facility.longitude! }}
      onClick={handleClick}
    >
      <Pin
        background="#eb2573"
        borderColor="#c41e60"
        glyphColor="#fff"
      />
      {showInfoWindow && open && (
        <InfoWindow
          position={{ lat: facility.latitude!, lng: facility.longitude! }}
          onCloseClick={() => setOpen(false)}
        >
          <div className="p-1">
            <p className="font-semibold text-sm text-gray-900">
              {facility.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{facility.address}</p>
            <Link
              href={`/driver/facilities/${facility.id}`}
              className="text-xs text-trust-blue hover:underline mt-1 inline-block"
            >
              View details →
            </Link>
          </div>
        </InfoWindow>
      )}
    </AdvancedMarker>
  );
}
