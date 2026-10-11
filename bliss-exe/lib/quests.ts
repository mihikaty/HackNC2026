// Shared by TouchGrass.exe and the server (which narrates quests as voice notes).

export type QuestCategory = "Nature" | "Landmark" | "Creative" | "Mindful" | "Adventure";

export type Quest = {
  id: string;
  title: string;
  description: string;
  points: number;
  category: QuestCategory;
  time: string;
  location: string;
  bonusChallenge: string;
};

export const QUESTS: Quest[] = [
  { id: "find-carolina-blue", title: "Find Carolina Blue", description: "Find something Carolina blue.", points: 5, category: "Creative", time: "2 min", location: "Anywhere on campus", bonusChallenge: "Find two different shades of blue." },
  { id: "visit-old-well", title: "Old Well Detail Detective", description: "Spot one detail at the Old Well.", points: 10, category: "Landmark", time: "5 min", location: "The Old Well", bonusChallenge: "Describe the detail in five words or less." },
  { id: "coker-arboretum", title: "Mini Arboretum Safari", description: "Find one interesting plant.", points: 15, category: "Nature", time: "10 min", location: "Coker Arboretum", bonusChallenge: "Find a leaf with an interesting shape." },
  { id: "new-campus-spot", title: "Unlock a New Spot", description: "Explore a spot you rarely visit.", points: 20, category: "Adventure", time: "10–15 min", location: "Your choice", bonusChallenge: "Give your new spot a silly code name." },
  { id: "mccorkle-moment", title: "McCorkle Sound Quest", description: "Listen for three different sounds.", points: 10, category: "Mindful", time: "3 min", location: "McCorkle Place", bonusChallenge: "Identify one sound you usually tune out." },
  { id: "bell-tower-sound-check", title: "Bell Tower Sound Check", description: "Pause and listen near the Bell Tower.", points: 10, category: "Landmark", time: "5 min", location: "Morehead-Patterson Bell Tower area", bonusChallenge: "Notice a sound coming from far away." },
  { id: "campus-color-collector", title: "Campus Color Collector", description: "Find five colors outside.", points: 15, category: "Creative", time: "5 min", location: "Anywhere outdoors", bonusChallenge: "Find a color that is not blue or green." },
  { id: "carolina-sky-check", title: "Carolina Sky Check", description: "Look up and notice the sky.", points: 10, category: "Mindful", time: "2 min", location: "An open outdoor spot", bonusChallenge: "Describe the sky like a weather reporter." },
  { id: "battle-park-break", title: "Battle Park Reset", description: "Take a calm outdoor reset.", points: 20, category: "Nature", time: "10–15 min", location: "Battle Park", bonusChallenge: "Notice one thing that changes as you walk." },
  { id: "campus-tree-check", title: "Tree Texture Detective", description: "Compare three trees.", points: 15, category: "Nature", time: "7 min", location: "Any campus green space", bonusChallenge: "Pick a favorite and explain why." },
  { id: "outdoor-reading-break", title: "Read Outside", description: "Read a few pages outside.", points: 15, category: "Mindful", time: "10 min", location: "A comfortable outdoor seat", bonusChallenge: "Take one slow breath before reading again." },
  { id: "tar-heel-walk", title: "Tar Heel Wander", description: "Take a relaxed campus walk.", points: 15, category: "Adventure", time: "10 min", location: "Choose your route", bonusChallenge: "Take a different turn than you normally would." },
  { id: "bird-watcher", title: "Bird Detective", description: "Spot or hear a bird.", points: 10, category: "Nature", time: "3–5 min", location: "A tree-lined path or lawn", bonusChallenge: "Notice how the bird moves or sounds." },
  { id: "leaf-shapes", title: "Leaf Shape Hunt", description: "Find two different leaf shapes.", points: 10, category: "Nature", time: "5 min", location: "A garden or tree-lined path", bonusChallenge: "Look for differences without picking the leaves." },
  { id: "shadow-hunt", title: "Shadow Explorer", description: "Find three interesting shadows.", points: 10, category: "Creative", time: "4 min", location: "A sunny outdoor spot", bonusChallenge: "Find the funniest-looking shadow." },
  { id: "campus-photo", title: "Tiny Campus Photo Walk", description: "Photograph a tiny campus detail.", points: 15, category: "Creative", time: "5–10 min", location: "Anywhere outdoors", bonusChallenge: "Frame the photo without including a person." },
  { id: "sit-without-phone", title: "Phone-Free Pause", description: "Take three minutes away from scrolling.", points: 10, category: "Mindful", time: "3 min", location: "A safe, comfortable spot", bonusChallenge: "Name one thing you can see, hear, and feel." },
  { id: "find-water", title: "Follow the Water", description: "Find a fountain or water feature.", points: 10, category: "Adventure", time: "5–10 min", location: "Campus or nearby public space", bonusChallenge: "Notice how light reflects on the water." },
  { id: "native-plant", title: "Native Plant Spotter", description: "Spot a native plant or label.", points: 15, category: "Nature", time: "5–10 min", location: "Coker Arboretum or a campus garden", bonusChallenge: "Learn the name if a label is available." },
  { id: "green-route", title: "Choose the Greener Route", description: "Choose a greener route to your next stop.", points: 15, category: "Adventure", time: "5–10 min", location: "Your usual campus route", bonusChallenge: "Notice one detail on the route you usually miss." },
  { id: "bench-review", title: "Bench Review Board", description: "Rate an outdoor bench and its view.", points: 10, category: "Creative", time: "5 min", location: "Any public campus seating", bonusChallenge: "Give it a review out of five stars." },
  { id: "campus-art", title: "Outdoor Art Spotter", description: "Spot outdoor art or an unusual detail.", points: 15, category: "Landmark", time: "5 min", location: "Campus paths and public spaces", bonusChallenge: "Think of a title you would give it." },
  { id: "five-textures", title: "Texture Quest", description: "Notice five outdoor textures.", points: 15, category: "Creative", time: "5 min", location: "A campus path or green space", bonusChallenge: "Find the roughest-looking and smoothest-looking surfaces." },
  { id: "friend-walk", title: "Two-Person Side Quest", description: "Take a short walk with a friend.", points: 20, category: "Adventure", time: "10 min", location: "Any comfortable campus route", bonusChallenge: "Ask each other for one favorite campus spot." },
  { id: "find-courtyard", title: "Courtyard Checkpoint", description: "Find a quiet public courtyard.", points: 10, category: "Adventure", time: "5 min", location: "A public campus courtyard", bonusChallenge: "Notice what makes this spot feel different." },
  { id: "sun-and-shade", title: "Sun or Shade?", description: "Compare a sunny and shady spot.", points: 10, category: "Mindful", time: "3 min", location: "A safe outdoor spot", bonusChallenge: "Choose which spot you would revisit and why." },
  { id: "five-senses", title: "Five-Sense Snapshot", description: "Notice one detail with your senses.", points: 15, category: "Mindful", time: "3 min", location: "Anywhere outdoors", bonusChallenge: "Name one thing you had not noticed before." },
  { id: "campus-bench-break", title: "Touch Grass, Literally Optional", description: "Spend five comfortable minutes outside.", points: 10, category: "Mindful", time: "5 min", location: "Any comfortable outdoor spot", bonusChallenge: "Let your eyes rest on something far away." },
];
