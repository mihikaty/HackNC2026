import Image from "next/image";
import styles from "./ExploreApp.module.css";

const mapLocations = [
  {
    id: "coker-arboretum",
    name: "Coker Arboretum",
    x: 67.2,
    y: 17.4,
  },
  {
    id: "sitterson-tables",
    name: "Sitterson Hall",
    x: 36.9,
    y: 33.9,
  },
  {
    id: "quad-old-well",
    name: "The Quad / Old Well",
    x: 52.3,
    y: 22.7,
  },
] as const;

type ExploreMapProps = {
  selectedLocationId: string;
  onSelectLocation: (locationId: string) => void;
};

export default function ExploreMap({
  selectedLocationId,
  onSelectLocation,
}: ExploreMapProps) {
  return (
    <section className={styles.mapSection} aria-labelledby="map-heading">
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.mapEyebrow}>UNC campus map</p>
          <h3 id="map-heading">Campus map</h3>
        </div>
      </div>

      <div className={styles.mapFrameWrapper}>
        <Image
          className={styles.mapImage}
          src="/UNCMap.png"
          alt="Map of the UNC Chapel Hill campus"
          width={999}
          height={768}
          sizes="(max-width: 640px) 100vw, 800px"
        />
        {mapLocations.map((location) => {
          const isSelected = location.id === selectedLocationId;

          return (
            <button
              key={location.id}
              className={`${styles.mapMarker} ${
                isSelected ? styles.mapMarkerSelected : ""
              }`}
              style={{ left: `${location.x}%`, top: `${location.y}%` }}
              onClick={() => onSelectLocation(location.id)}
              type="button"
              aria-label={`Select ${location.name}`}
              aria-pressed={isSelected}
              title={location.name}
            >
              <span className={styles.mapMarkerDot} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
