type LocationCardProps = {
  location: {
    id: string;
    name: string;
    description: string;
    seating: string;
    shade: string;
    image: string;
  };
  onSendToSprout: (id: string) => void;
};

export default function LocationCard({ location, onSendToSprout }: LocationCardProps) {
  return (
    <button onClick={() => onSendToSprout(location.id)}>
      Send to Sprout
    </button>
  );
}