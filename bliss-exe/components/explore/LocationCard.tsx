import styles from "./ExploreApp.module.css";

type Location = {
  id: string;
  name: string;
  description: string;
  seating: string;
  shade: string;
};

type LocationCardProps = {
  location: Location;
  onSendToSprout: (id: string) => void;
};

export default function LocationCard({
  location,
  onSendToSprout,
}: LocationCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardIcon} aria-hidden="true">
        🌿
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
        <button
          className={styles.action}
          onClick={() => onSendToSprout(location.id)}
          type="button"
        >
          Send to Sprout
          <span aria-hidden="true"> →</span>
        </button>
      </div>
    </article>
  );
}
