import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { mockProjects } from "@/lib/mockData";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

interface MapViewProps {
  onProjectClick?: (projectId: string) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  showHeatmap?: boolean;
  pinnedLocations?: { lat: number; lng: number }[];
}

export default function MapView({ onProjectClick, onMapClick, showHeatmap = true, pinnedLocations = [] }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Use refs for callbacks to avoid re-initializing map when functions change
  const onMapClickRef = useRef(onMapClick);
  const onProjectClickRef = useRef(onProjectClick);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
    onProjectClickRef.current = onProjectClick;
  }, [onMapClick, onProjectClick]);

  // Handle Pinned Locations & Polygon
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Clear old markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add new markers
    pinnedLocations.forEach((loc, i) => {
      const m = new mapboxgl.Marker({ color: "#FF0000" }) // Red for all area pins
        .setLngLat([loc.lng, loc.lat])
        .addTo(map.current!);
      markers.current.push(m);
    });

    // Handle Area Polygon & Auto-Zoom
    const m = map.current!;
    if (pinnedLocations.length >= 1) {
      // Focus map on markers if they exist (on load or when count changes)
      const bounds = new mapboxgl.LngLatBounds();
      pinnedLocations.forEach(loc => bounds.extend([loc.lng, loc.lat]));

      // We only want to auto-zoom on load or when switching tabs (remount)
      // If we are actively clicking, maybe don't jump? 
      // Actually, for better UX across tabs, a gentle flyTo/fitBounds is good.
      m.fitBounds(bounds, {
        padding: 80,
        maxZoom: 16,
        duration: 2000,
        essential: true
      });
    }

    if (pinnedLocations.length >= 2) {
      const coords = pinnedLocations.map(l => [l.lng, l.lat]);
      // For polygon, we need to close the loop
      const polygonCoords = [...coords, coords[0]];

      const source = m.getSource('selected-area') as mapboxgl.GeoJSONSource;
      const data: GeoJSON.Feature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords]
        },
        properties: {}
      };

      if (source) {
        source.setData(data);
      } else {
        m.addSource('selected-area', {
          type: 'geojson',
          data: data
        });
        m.addLayer({
          id: 'selected-area-layer',
          type: 'fill',
          source: 'selected-area',
          paint: {
            'fill-color': '#FF0000', // Red fill
            'fill-opacity': 0.3
          }
        });
        m.addLayer({
          id: 'selected-area-outline',
          type: 'line',
          source: 'selected-area',
          paint: {
            'line-color': '#FF0000', // Red outline
            'line-width': 3,
            'line-dasharray': [2, 1]
          }
        });
      }
    } else {
      if (m.getLayer('selected-area-layer')) m.removeLayer('selected-area-layer');
      if (m.getLayer('selected-area-outline')) m.removeLayer('selected-area-outline');
      if (m.getSource('selected-area')) m.removeSource('selected-area');
    }
  }, [pinnedLocations, loaded]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/standard",
      center: [78.9629, 20.5937], // India center
      zoom: 4.5,
      pitch: 45,
      bearing: 0,
      antialias: true,
      projection: "globe",
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      placeholder: 'Search location...',
      proximity: { longitude: 78.9629, latitude: 20.5937 }
    });

    map.current.addControl(geocoder, 'top-right');
    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    map.current.on("style.load", () => {
      const m = map.current!;
      m.setFog({
        color: "hsl(220, 40%, 6%)",
        "high-color": "hsl(220, 30%, 14%)",
        "horizon-blend": 0.08,
        "space-color": "hsl(222, 47%, 4%)",
        "star-intensity": 0.6,
      });

      setLoaded(true);
    });

    map.current.on("load", () => {
      const m = map.current!;

      // Add project markers as GeoJSON
      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: mockProjects.map((p) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: p.location.coordinates },
          properties: { id: p.id, name: p.name, riskScore: p.riskScore, riskLevel: p.riskLevel, hazardType: p.hazardType },
        })),
      };

      m.addSource("projects", { type: "geojson", data: geojson });

      m.addLayer({
        id: "project-points",
        type: "circle",
        source: "projects",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "riskScore"], 30, 8, 90, 16],
          "circle-color": [
            "match", ["get", "riskLevel"],
            "High", "hsl(0, 72%, 51%)",
            "Medium", "hsl(38, 92%, 50%)",
            "Low", "hsl(152, 69%, 45%)",
            "hsl(192, 100%, 50%)",
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.2)",
          "circle-blur": 0.3,
        },
      });

      // Flood heatmap layer
      if (showHeatmap) {
        m.addLayer({
          id: "flood-heatmap",
          type: "heatmap",
          source: "projects",
          paint: {
            "heatmap-weight": ["interpolate", ["linear"], ["get", "riskScore"], 0, 0, 100, 1],
            "heatmap-intensity": 0.6,
            "heatmap-radius": 60,
            "heatmap-opacity": 0.5,
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.2, "hsl(220, 80%, 60%)",
              0.4, "hsl(192, 100%, 50%)",
              0.6, "hsl(38, 92%, 50%)",
              1, "hsl(0, 72%, 51%)",
            ],
          },
        });
      }

      // Click handler for pinning
      m.on("click", (e) => {
        const features = m.queryRenderedFeatures(e.point, { layers: ["project-points"] });
        if (features.length === 0) {
          onMapClickRef.current?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }
      });

      // Existing project points click handler
      m.on("click", "project-points", (e) => {
        if (e.features?.[0]?.properties?.id) {
          const id = e.features[0].properties.id;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
          m.flyTo({
            center: coords,
            zoom: 12,
            pitch: 60,
            bearing: -20,
            duration: 2500,
            essential: true,
          });
          onProjectClickRef.current?.(id);
        }
      });

      m.on("mouseenter", "project-points", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "project-points", () => { m.getCanvas().style.cursor = ""; });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [showHeatmap, loaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-xl overflow-hidden" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
