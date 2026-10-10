import LocationCard from "./LocationCard";
import styles from "./ExploreApp.module.css";

const locations = [
  {
    id: "coker-arboretum",
    name: "Coker Arboretum",
    description: "Quiet trails and lots of shade.",
    seating: "Benches and picnic tables",
    shade: "High",
  },
  {
    id: "sitterson-tables",
    name: "Sitterson Hall Tables",
    description: "Outdoor study tables near campus walkways.",
    seating: "Outdoor tables",
    shade: "Medium",
  },
];

export default function ExploreApp() {
  const handleSendToSprout = (locationId: string) => {
    console.log(locationId);
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

      <div className={styles.locations}>
        {locations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
            onSendToSprout={handleSendToSprout}
          />
        ))}
      </div>
    </section>
  );
}
