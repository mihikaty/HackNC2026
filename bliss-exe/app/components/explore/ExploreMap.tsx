import Image from "next/image";
import styles from "./ExploreApp.module.css";

export default function ExploreMap() {
  return (
    <section className={styles.mapSection} aria-labelledby="map-heading">
      <div className={styles.mapHeader}>
        <div>
          <p className={styles.mapEyebrow}>UNC campus map</p>
          <h3 id="map-heading">Campus map</h3>
        </div>

        <a
          className={styles.mapLink}
          href="/UNCMap.png"
          target="_blank"
          rel="noreferrer"
        >
          Open full map
        </a>
      </div>

      <div className={styles.mapFrameWrapper}>
        <Image
          className={styles.mapImage}
          src="/UNCMap.png"
          alt="Map of the UNC Chapel Hill campus"
          fill
          sizes="(max-width: 640px) 100vw, 800px"
        />
      </div>
    </section>
  );
}
