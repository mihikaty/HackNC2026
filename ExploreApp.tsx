import LocationCard from "./LocationCard.tsx";

// ExploreApp.tsx
const locations = [
  {
    id: "coker-arboretum",
    name: "Coker Arboretum",
    description: "Quiet trails and lots of shade.",
    seating: "Benches and picnic tables",
    shade: "High",
    image: "..."
  },
  {
    id: "sitterson-tables",
    name: "Sitterson Hall Tables",
    description: "Outdoor study tables near campus walkways.",
    seating: "Outdoor tables",
    shade: "Medium",
    image: "..."
  }
];

export default function ExploreApp() {
  const handleSendToSprout = (locationId: string) => {
    console.log(locationId);
  };

  return (
    <div>
      {locations.map((location) => (
        <LocationCard
          key={location.id}
          location={location}
          onSendToSprout={handleSendToSprout}
        />
      ))}
    </div>
  );
}