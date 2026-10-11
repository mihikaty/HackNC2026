"use client";

import { useState } from "react";
import ExploreMap from "./ExploreMap";
import LocationCard from "./LocationCard";
import styles from "./ExploreApp.module.css";
import { useSprout } from "@/components/sprout/SproutProvider";

const locations = [
  {
    id: "coker-arboretum",
    name: "Coker Arboretum",
    description: "Quiet trails and lots of shade.",
    seating: "Benches and picnic tables",
    shade: "High",
    icon: "🌳",
  },
  {
    id: "sitterson-tables",
    name: "Sitterson Hall",
    description: "Outdoor tables beside a central campus study spot.",
    seating: "Outdoor tables",
    shade: "Medium",
    icon: "📚",
  },
  {
    id: "quad-old-well",
    name: "The Quad / Old Well",
    description: "An open green around one of UNC's best-known landmarks.",
    seating: "Lawn and nearby benches",
    shade: "Partial",
    icon: "⛲",
  },
];

export default function ExploreApp() {
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0].id);
  const selectedLocation =
    locations.find((location) => location.id === selectedLocationId) ??
    locations[0];

  const { sendFromApp, textMe } = useSprout();

  const handleSendToSprout = (locationId: string) => {
    const location = locations.find((item) => item.id === locationId);

    if (!location) return;

    textMe({ kind: "study-spot", spotId: location.id });
    sendFromApp({
      appId: "explore",
      text: `Can you help me plan a study session at ${location.name}?`,
      context: `Campus study spot "${location.name}": ${location.description} Seating: ${location.seating}. Shade: ${location.shade}.`,
    });
  };

  return (
    <section className={styles.explore} aria-labelledby="explore-heading">
      <header className={styles.header}>
        <p className={styles.eyebrow}>A change of scenery</p>

        <h2 id="explore-heading">Find your outdoor study spot</h2>

        <p className={styles.intro}>
          Take your work outside at one of these nearby campus spots.
        </p>
      </header>

      <ExploreMap
        selectedLocationId={selectedLocationId}
        onSelectLocation={setSelectedLocationId}
      />

      <section
        className={styles.selectedPanel}
        aria-labelledby="selected-location-heading"
        aria-live="polite"
      >
        <div className={styles.selectedHeader}>
          <p className={styles.mapEyebrow}>Selected study spot</p>
          <span className={styles.selectedIcon} aria-hidden="true">
            {selectedLocation.icon}
          </span>
        </div>
        <h3 id="selected-location-heading">{selectedLocation.name}</h3>
        <p className={styles.description}>{selectedLocation.description}</p>
        <dl className={styles.details}>
          <div>
            <dt>Seating</dt>
            <dd>{selectedLocation.seating}</dd>
          </div>
          <div>
            <dt>Shade</dt>
            <dd>{selectedLocation.shade}</dd>
          </div>
        </dl>
        <button
          className={styles.action}
          onClick={() => handleSendToSprout(selectedLocation.id)}
          type="button"
        >
          Send to Sprout
          <span aria-hidden="true"> →</span>
        </button>
      </section>

      <section
        className={styles.locationsSection}
        aria-labelledby="locations-heading"
      >
        <div className={styles.locationsHeading}>
          <p className={styles.mapEyebrow}>Study habitats</p>
          <h3 id="locations-heading">Nearby study spots</h3>
        </div>

        <div className={styles.locations}>
          {locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              isSelected={location.id === selectedLocationId}
              onSelect={setSelectedLocationId}
              onSendToSprout={handleSendToSprout}
            />
          ))}
        </div>
      </section>
    </section>
  );
}