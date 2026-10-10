import styles from "./ExploreApp.module.css";

type Location = {
  id: string;
  name: string;
  description: string;
  seating: string;
  shade: string;
  icon: string;
};

type LocationCardProps = {
  location: Location;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSendToSprout: (id: string) => void;
};

export default function LocationCard({
  location,
  isSelected,
  onSelect,
  onSendToSprout,
}: LocationCardProps) {
  return (
    <article
      className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
      aria-current={isSelected ? "true" : undefined}
    >
      <div className={styles.cardIcon} aria-hidden="true">
        {location.icon}
      </div>
      <div className={styles.cardBody}>
        <h3>{location.name}</h3>
        <p className={styles.description}>{location.description}</p>
        <dl className={styles.details}>
          <div>
            <dt>Seating</dt>
            <dd>{location.seating}</dd>
          </div>
          <div>
            <dt>Shade</dt>
            <dd>{location.shade}</dd>
          </div>
        </dl>
        <div className={styles.cardActions}>
          <button
            className={styles.selectAction}
            onClick={() => onSelect(location.id)}
            type="button"
            aria-pressed={isSelected}
          >
            {isSelected ? "Selected" : "Select spot"}
          </button>
          <button
            className={styles.action}
            onClick={() => onSendToSprout(location.id)}
            type="button"
          >
            Send to Sprout
            <span aria-hidden="true"> →</span>
          </button>
        </div>
      </div>
    </article>
  );
}
