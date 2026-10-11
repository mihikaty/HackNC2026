"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSprout } from "@/app/components/sprout/SproutProvider";
import "leaflet/dist/leaflet.css";
import "./explore.css";

type StudySpot = {
  id: string;
  name: string;
  category: "Outdoor" | "Library" | "Campus";
  description: string;
  seating: string;
  shade: string;
  coordinates: [number, number];
  address: string;
  tags: string[];
};

// One source of truth for map pins, cards, search, directions, and Sprout context.
// Coordinates are approximate. Replace this array with a campus places API when available.
const STUDY_SPOTS: StudySpot[] = [
  {
    id: "coker-arboretum", name: "Coker Arboretum", category: "Outdoor",
    description: "A leafy garden with winding paths for a quieter study break.",
    seating: "Benches and nearby lawn", shade: "High", coordinates: [35.9137, -79.0476],
    address: "Coker Arboretum, UNC Chapel Hill", tags: ["quiet", "nature", "reading"],
  },
  {
    id: "sitterson-hall", name: "Sitterson Hall", category: "Campus",
    description: "A central computer science building with convenient campus access.",
    seating: "Indoor common areas; check building access", shade: "Mixed", coordinates: [35.9109, -79.0545],
    address: "Sitterson Hall, UNC Chapel Hill", tags: ["computing", "group work", "campus"],
  },
  {
    id: "old-well", name: "Old Well & Polk Place", category: "Outdoor",
    description: "An iconic campus green with open-air space between classes.",
    seating: "Lawn and nearby benches", shade: "Partial", coordinates: [35.9122, -79.0512],
    address: "Old Well, UNC Chapel Hill", tags: ["landmark", "fresh air", "break"],
  },
  {
    id: "davis-library", name: "Davis Library", category: "Library",
    description: "A major library option for an indoor study environment.",
    seating: "Indoor desks and study areas", shade: "Indoors", coordinates: [35.9096, -79.0498],
    address: "Davis Library, UNC Chapel Hill", tags: ["library", "quiet", "indoor"],
  },
  {
    id: "wilson-library", name: "Wilson Library", category: "Library",
    description: "A historic library setting for focused individual work.",
    seating: "Indoor study spaces; check current access", shade: "Indoors", coordinates: [35.9098, -79.0509],
    address: "Wilson Library, UNC Chapel Hill", tags: ["library", "reading", "quiet"],
  },
  {
    id: "student-union", name: "Student Union", category: "Campus",
    description: "A central campus hub with places to pause, meet, and work.",
    seating: "Indoor and nearby outdoor seating", shade: "Mixed", coordinates: [35.9108, -79.0477],
    address: "Student Union, UNC Chapel Hill", tags: ["meeting", "food nearby", "group work"],
  },
];

type MapInstance = {
  remove: () => void;
  setView: (center: [number, number], zoom: number, options?: object) => void;
  invalidateSize: (options?: object) => void;
};
type LayerGroup = { clearLayers: () => void; };
type LeafletApi = {
  map: (element: HTMLElement, options?: object) => MapInstance;
  tileLayer: (url: string, options?: object) => { addTo: (map: MapInstance) => unknown };
  layerGroup: () => LayerGroup & { addTo: (map: MapInstance) => LayerGroup };
  marker: (coords: [number, number], options?: object) => {
    bindPopup: (html: string) => unknown;
    on: (event: string, callback: () => void) => unknown;
    addTo: (group: LayerGroup) => unknown;
  };
  divIcon: (options: object) => unknown;
};

const MAP_CENTER: [number, number] = [35.9116, -79.051];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] ?? char);
}

export default function ExploreApp() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<LeafletApi | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState(STUDY_SPOTS[0].id);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | StudySpot["category"]>("All");
  const [mapReady, setMapReady] = useState(false);
  const { sendFromApp, textMe } = useSprout();

  const visibleSpots = useMemo(() => {
    const query = search.trim().toLowerCase();
    return STUDY_SPOTS.filter((spot) => {
      const text = [spot.name, spot.description, spot.category, spot.address, ...spot.tags].join(" ").toLowerCase();
      return (category === "All" || spot.category === category) && (!query || text.includes(query));
    });
  }, [search, category]);

  const selectSpot = useCallback((id: string) => {
    setSelectedLocationId(id);
    const spot = STUDY_SPOTS.find((item) => item.id === id);
    if (spot && mapRef.current) mapRef.current.setView(spot.coordinates, 17, { animate: true });
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initializeMap() {
      if (!mapElementRef.current || mapRef.current) return;
      try {
        const leafletModule = await import("leaflet");
        if (cancelled || !mapElementRef.current) return;
        const moduleWithDefault = leafletModule as unknown as { default?: LeafletApi };
        const L = (moduleWithDefault.default ?? leafletModule) as unknown as LeafletApi;
        leafletRef.current = L;
        const map = L.map(mapElementRef.current, { center: MAP_CENTER, zoom: 16, zoomControl: true, scrollWheelZoom: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);
        markerLayerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;
        setMapReady(true);
        window.setTimeout(() => map.invalidateSize(), 200);
        resizeObserverRef.current = new ResizeObserver(() => map.invalidateSize());
        resizeObserverRef.current.observe(mapElementRef.current);
      } catch (error) {
        console.error("Could not initialize the Explore map:", error);
      }
    }
    void initializeMap();
    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markerLayerRef.current;
    if (!L || !layer) return;
    layer.clearLayers();
    STUDY_SPOTS.forEach((spot) => {
      const selected = spot.id === selectedLocationId;
      const marker = L.marker(spot.coordinates, {
        icon: L.divIcon({
          className: "explore-leaflet-icon-shell",
          html: `<span class="explore-map-pin${selected ? " is-selected" : ""}">${STUDY_SPOTS.indexOf(spot) + 1}</span>`,
          iconSize: [42, 48], iconAnchor: [21, 42], popupAnchor: [0, -38],
        }),
        title: spot.name,
        keyboard: true,
      });
      marker.bindPopup(`<div class="explore-popup"><strong>${escapeHtml(spot.name)}</strong><span>${escapeHtml(spot.category)} · ${escapeHtml(spot.seating)}</span></div>`);
      marker.on("click", () => setSelectedLocationId(spot.id));
      marker.addTo(layer);
    });
  }, [selectedLocationId, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const frame = window.requestAnimationFrame(() => mapRef.current?.invalidateSize());
    return () => window.cancelAnimationFrame(frame);
  }, [mapReady]);

  const handleSendToSprout = (spot: StudySpot) => {
    textMe({ kind: "study-spot", spotId: spot.id });
    sendFromApp({
      appId: "explore",
      text: `Help me plan a study session at ${spot.name}.`,
      context: [
        `Study location: ${spot.name}`, `Location type: ${spot.category}`,
        `Description: ${spot.description}`, `Seating: ${spot.seating}`, `Shade: ${spot.shade}`,
        `Address or map search: ${spot.address}`, `Tags: ${spot.tags.join(", ")}`,
        "Suggest a realistic study plan and an indoor backup if weather or access is an issue.",
      ].join("\n"),
    });
  };

  const openDirections = (spot: StudySpot) => {
    const [lat, lng] = spot.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="explore-aero" aria-labelledby="explore-heading">
      <header className="explore-topbar">
        <div className="explore-brand-mark" aria-hidden="true">✦</div>
        <div className="explore-heading-copy">
          <p className="explore-eyebrow">ctrl + alt + study field guide · Chapel Hill</p>
          <h2 id="explore-heading">Find your study habitat</h2>
          <p className="explore-intro">Explore real campus geography, discover a place that fits your mood, and turn it into a plan with Sprout.</p>
        </div>
        <div className="explore-live-pill"><span /> Interactive map</div>
      </header>

      <section className="explore-workspace" aria-label="Study spot map and results">
        <div className="explore-map-column">
          <div className="explore-map-toolbar">
            <div><p className="explore-section-kicker">CAMPUS EXPLORER</p><h3>UNC Chapel Hill</h3></div>
            <div className="explore-map-legend"><span /> Study spots</div>
          </div>
          <div className="explore-map-frame">
            <div ref={mapElementRef} className="explore-leaflet-map" aria-label="Interactive map of UNC Chapel Hill study spots" />
            {!mapReady && <div className="explore-map-loading"><span className="explore-loading-orb" /><strong>Preparing your map</strong><span>Loading campus streets and study spots…</span></div>}
            <div className="explore-map-caption"><span className="explore-caption-dot" /> OpenStreetMap · approximate spot pins</div>
          </div>
          <div className="explore-map-footer"><span><strong>{STUDY_SPOTS.length}</strong> curated campus places</span><span>Choose a pin or a card to explore</span></div>
        </div>

        <aside className="explore-results-panel" aria-label="Study spot finder">
          <div className="explore-results-heading">
            <div><p className="explore-section-kicker">YOUR NEXT STUDY SPOT</p><h3>Find your fit</h3></div>
            <span className="explore-count">{visibleSpots.length}</span>
          </div>
          <label className="explore-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search places, vibes, or features" aria-label="Search study spots" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
          </label>
          <div className="explore-filters" role="group" aria-label="Filter by place type">
            {(["All", "Outdoor", "Library", "Campus"] as const).map((item) => <button key={item} type="button" className={`explore-filter${category === item ? " is-active" : ""}`} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>)}
          </div>
          <div className="explore-spot-list">
            {visibleSpots.map((spot) => {
              const isSelected = spot.id === selectedLocationId;
              return <article key={spot.id} className={`explore-spot-card${isSelected ? " is-selected" : ""}`}>
                <button type="button" className="explore-spot-select" onClick={() => selectSpot(spot.id)} aria-pressed={isSelected} aria-label={`Show ${spot.name} on the map`}>
                  <span className="explore-spot-copy"><span className="explore-spot-title">{spot.name}</span><span className="explore-spot-meta">{spot.category}<i />{spot.shade} shade</span><span className="explore-spot-description">{spot.description}</span></span>
                  <span className="explore-chevron" aria-hidden="true">↗</span>
                </button>
                {isSelected && <div className="explore-selected-details">
                  <div className="explore-detail-row"><span>SEATING</span><strong>{spot.seating}</strong></div>
                  <div className="explore-spot-actions">
                    <button type="button" className="explore-primary-action" onClick={() => handleSendToSprout(spot)}><span aria-hidden="true">✧</span> Plan with Sprout</button>
                    <button type="button" className="explore-secondary-action" onClick={() => openDirections(spot)}>Directions <span aria-hidden="true">↗</span></button>
                  </div>
                </div>}
              </article>;
            })}
            {visibleSpots.length === 0 && <div className="explore-empty-state"><span aria-hidden="true">☁</span><strong>No spots found</strong><p>Try another search or switch the place filter.</p><button type="button" onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button></div>}
          </div>
          <div className="explore-sprout-note"><span className="explore-sprout-sparkle" aria-hidden="true">✦</span><p><strong>A little help from Sprout</strong><br />Choose a place to build a study plan around your surroundings.</p></div>
        </aside>
      </section>
      <footer className="explore-disclaimer"><span aria-hidden="true">ⓘ</span> Place details are a curated starting point. Confirm building access, seating, and current conditions before heading out.</footer>
    </main>
  );
}
