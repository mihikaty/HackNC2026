"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./TouchGrassApp.module.css";
import { SendToSproutButton } from "@/app/components/sprout/SendToSproutButton";

type QuestCategory = "Nature" | "Landmark" | "Creative" | "Mindful" | "Adventure";
type QuestFilter = "All" | QuestCategory;

type Quest = {
  id: string;
  title: string;
  description: string;
  points: number;
  category: QuestCategory;
  time: string;
  location: string;
  bonusChallenge: string;
};

type BingoSquare = {
  id: string;
  title: string;
  detail: string;
};

type SavedProgress = {
  gardenScore: number;
  completedQuestIds: string[];
  activeQuestIds: string[];
  completedBingoIds: string[];
  completedBingoLines: string[];
};

const STORAGE_KEY = "touchgrass-progress-v2";
const QUESTS_VISIBLE_AT_ONCE = 4;
const POINTS_PER_SPROUT = 20;

const questPool: Quest[] = [
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

const plantFacts = [
  "Coker Arboretum opened in 1903 and spans about five acres.",
  "Coker Arboretum has a rich mix of trees and shrubs.",
  "UNC’s Botanical Garden focuses on southeastern native plants.",
  "The Botanical Garden includes water gardens and carnivorous plants.",
  "Wild Venus flytraps are native to a small area of coastal North Carolina.",
  "Carolina Community Garden brings people together to grow food.",
  "Battle Park is a wooded natural area beside campus.",
];

const bingoSquares: BingoSquare[] = [
  { id: "blue", title: "Find Carolina Blue", detail: "Spot the campus color." },
  { id: "bird", title: "Hear a Bird", detail: "Spot or hear one." },
  { id: "shade", title: "Find Shade", detail: "Notice the cooler spot." },
  { id: "landmark", title: "Visit a Landmark", detail: "Pause at a campus landmark." },
  { id: "free", title: "Take a 3-Minute Pause", detail: "Breathe and look around." },
  { id: "colors", title: "Find 5 Colors", detail: "Look around, no picking." },
  { id: "leaves", title: "Compare Leaves", detail: "Find two different shapes." },
  { id: "sound", title: "Notice 3 Sounds", detail: "Pause and listen." },
  { id: "newspot", title: "Try a New Route", detail: "Take a different campus path." },
];

const bingoLines = [
  ["blue", "bird", "shade"], ["landmark", "free", "colors"], ["leaves", "sound", "newspot"],
  ["blue", "landmark", "leaves"], ["bird", "free", "sound"], ["shade", "colors", "newspot"],
  ["blue", "free", "newspot"], ["shade", "free", "leaves"],
] as const;

type BadgeDefinition = {
  id: string;
  title: string;
  description: string;
  unlocked: (quests: number, score: number, bingo: number, lines: number) => boolean;
};

const badgeDefinitions: BadgeDefinition[] = [
  { id: "first-step", title: "First Fresh Air", description: "Complete your first quest.", unlocked: (quests) => quests >= 1 },
  { id: "campus-roamer", title: "Campus Roamer", description: "Complete 5 quests.", unlocked: (quests) => quests >= 5 },
  { id: "bingo-beginner", title: "Bingo Beginner", description: "Check off 3 bingo squares.", unlocked: (_quests, _score, bingo) => bingo >= 3 },
  { id: "nature-scout", title: "Nature Scout", description: "Complete 10 quests.", unlocked: (quests) => quests >= 10 },
  { id: "garden-grower", title: "Garden Grower", description: "Grow 5 sprouts.", unlocked: (_quests, score) => Math.floor(score / POINTS_PER_SPROUT) >= 5 },
  { id: "bingo-master", title: "Bingo Master", description: "Complete a full bingo line.", unlocked: (_quests, _score, _bingo, lines) => lines >= 1 },
];

function getRandomQuest(quests: Quest[]): Quest | null {
  if (quests.length === 0) return null;
  return quests[Math.floor(Math.random() * quests.length)];
}

function getAvailableQuests(completedIds: string[], activeIds: string[]) {
  return questPool.filter((quest) => !completedIds.includes(quest.id) && !activeIds.includes(quest.id));
}

function createInitialActiveQuests(completedIds: string[], preferredIds: string[] = []) {
  const byId = new Map(questPool.map((quest) => [quest.id, quest]));
  const preferred = preferredIds
    .map((id) => byId.get(id))
    .filter((quest): quest is Quest => Boolean(quest) && !completedIds.includes(quest!.id));
  const uniquePreferred = preferred.filter((quest, index, array) => array.findIndex((candidate) => candidate.id === quest.id) === index);
  const remaining = questPool.filter((quest) => !completedIds.includes(quest.id) && !uniquePreferred.some((active) => active.id === quest.id));
  return [...uniquePreferred, ...remaining].slice(0, QUESTS_VISIBLE_AT_ONCE);
}

export default function TouchGrassApp() {
  const [activeQuests, setActiveQuests] = useState<Quest[]>(questPool.slice(0, QUESTS_VISIBLE_AT_ONCE));
  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>([]);
  const [gardenScore, setGardenScore] = useState(0);
  const [completedBingoIds, setCompletedBingoIds] = useState<string[]>([]);
  const [completedBingoLines, setCompletedBingoLines] = useState<string[]>([]);
  const [filter, setFilter] = useState<QuestFilter>("All");
  const [celebration, setCelebration] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<SavedProgress>;
        const validQuestIds = new Set(questPool.map((quest) => quest.id));
        const restoredCompleted = Array.isArray(saved.completedQuestIds)
          ? saved.completedQuestIds.filter((id): id is string => typeof id === "string" && validQuestIds.has(id))
          : [];
        const restoredActive = createInitialActiveQuests(
          restoredCompleted,
          Array.isArray(saved.activeQuestIds) ? saved.activeQuestIds.filter((id): id is string => typeof id === "string") : [],
        );
        const validBingoIds = new Set(bingoSquares.map((square) => square.id));
        const restoredBingo = Array.isArray(saved.completedBingoIds)
          ? [...new Set(saved.completedBingoIds.filter((id): id is string => typeof id === "string" && validBingoIds.has(id)))]
          : [];
        const validLineIds = new Set(bingoLines.map((_, index) => String(index)));
        const restoredLines = Array.isArray(saved.completedBingoLines)
          ? [...new Set(saved.completedBingoLines.filter((id): id is string => typeof id === "string" && validLineIds.has(id)))]
          : [];

        setGardenScore(typeof saved.gardenScore === "number" && Number.isFinite(saved.gardenScore) ? Math.max(0, saved.gardenScore) : 0);
        setCompletedQuestIds([...new Set(restoredCompleted)]);
        setActiveQuests(restoredActive);
        setCompletedBingoIds(restoredBingo);
        setCompletedBingoLines(restoredLines);
      }
    } catch {
      // If stored data is unavailable or malformed, continue with a clean game.
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    const progress: SavedProgress = {
      gardenScore,
      completedQuestIds,
      activeQuestIds: activeQuests.map((quest) => quest.id),
      completedBingoIds,
      completedBingoLines,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // The game still works if browser storage is disabled.
    }
  }, [storageReady, gardenScore, completedQuestIds, activeQuests, completedBingoIds, completedBingoLines]);

  const sprouts = Math.floor(gardenScore / POINTS_PER_SPROUT);
  const pointsTowardNextSprout = gardenScore % POINTS_PER_SPROUT;
  const pointsNeeded = POINTS_PER_SPROUT - pointsTowardNextSprout;
  const sproutProgress = (pointsTowardNextSprout / POINTS_PER_SPROUT) * 100;
  const completedCount = completedQuestIds.length;
  const completedBingoCount = completedBingoIds.length;
  const currentPlantFact = sprouts === 0
    ? "Quests and bingo both help your garden grow."
    : plantFacts[(sprouts - 1) % plantFacts.length];

  const replacementQuestsAvailable = getAvailableQuests(completedQuestIds, activeQuests.map((quest) => quest.id));
  const allQuestsComplete = activeQuests.length === 0 && replacementQuestsAvailable.length === 0 && completedCount === questPool.length;
  const visibleQuests = filter === "All" ? activeQuests : activeQuests.filter((quest) => quest.category === filter);
  const sproutPick = useMemo(() => {
    const matchingQuest = filter === "All" ? null : activeQuests.find((quest) => quest.category === filter);
    return matchingQuest ?? activeQuests[0] ?? getRandomQuest(getAvailableQuests(completedQuestIds, activeQuests.map((quest) => quest.id)));
  }, [filter, activeQuests, completedQuestIds]);

  const unlockedBadges = badgeDefinitions.filter((badge) => badge.unlocked(completedCount, gardenScore, completedBingoCount, completedBingoLines.length));
  const nextBadge = badgeDefinitions.find((badge) => !unlockedBadges.some((unlocked) => unlocked.id === badge.id));

  function completeQuest(questId: string) {
    const completedQuest = activeQuests.find((quest) => quest.id === questId);
    if (!completedQuest || completedQuestIds.includes(questId)) return;

    const nextCompletedIds = [...completedQuestIds, questId];
    const remainingQuests = activeQuests.filter((quest) => quest.id !== questId);
    const replacements = questPool.filter(
      (quest) => !nextCompletedIds.includes(quest.id) && !remainingQuests.some((activeQuest) => activeQuest.id === quest.id),
    );
    const replacementQuest = getRandomQuest(replacements);
    setGardenScore((score) => score + completedQuest.points);
    setCompletedQuestIds(nextCompletedIds);
    setActiveQuests(replacementQuest ? [...remainingQuests, replacementQuest] : remainingQuests);
    setCelebration(`Quest complete: ${completedQuest.title}. +${completedQuest.points} points for your garden!`);
  }

  function surpriseMe() {
    const candidates = getAvailableQuests(completedQuestIds, activeQuests.map((quest) => quest.id)).filter(
      (quest) => filter === "All" || quest.category === filter,
    );
    const picked = getRandomQuest(candidates);
    if (!picked) {
      setCelebration(filter === "All" ? "You have discovered every quest. Check off some bingo squares to keep growing!" : `No new ${filter.toLowerCase()} quests are left. Try All to discover more.`);
      return;
    }
    setActiveQuests((current) => current.length < QUESTS_VISIBLE_AT_ONCE ? [...current, picked] : [...current.slice(0, QUESTS_VISIBLE_AT_ONCE - 1), picked]);
    setCelebration(`Surprise quest unlocked: ${picked.title}.`);
  }

  function completeBingoSquare(squareId: string) {
    if (completedBingoIds.includes(squareId)) return;
    const nextBingoIds = [...completedBingoIds, squareId];
    const nextBingoSet = new Set(nextBingoIds);
    const newlyCompletedLines: string[] = [];
    bingoLines.forEach((line, index) => {
      const lineId = String(index);
      if (!completedBingoLines.includes(lineId) && line.every((id) => nextBingoSet.has(id))) newlyCompletedLines.push(lineId);
    });
    const pointsEarned = 5 + newlyCompletedLines.length * 10;
    setCompletedBingoIds(nextBingoIds);
    if (newlyCompletedLines.length > 0) setCompletedBingoLines([...completedBingoLines, ...newlyCompletedLines]);
    setGardenScore((score) => score + pointsEarned);
    setCelebration(newlyCompletedLines.length > 0
      ? `Bingo line complete! You earned ${pointsEarned} garden points, including a line bonus.`
      : `Bingo square checked off. +${pointsEarned} garden points!`);
  }

  const sproutContext = `TouchGrass.exe progress. Garden score: ${gardenScore} points. Sprouts grown: ${sprouts}. ${pointsNeeded} points to next sprout. Quests completed: ${completedCount}/${questPool.length}. Bingo squares completed: ${completedBingoCount}/9; bingo lines completed: ${completedBingoLines.length}. Unlocked badges: ${unlockedBadges.map((badge) => badge.title).join(", ") || "none yet"}. Current category filter: ${filter}. Active quests: ${activeQuests.map((quest) => `${quest.title} (${quest.category}, ${quest.time}, +${quest.points} pts, at ${quest.location}): ${quest.description} Bonus: ${quest.bonusChallenge}`).join("; ") || "none"}. Remaining uncompleted quests: ${getAvailableQuests(completedQuestIds, activeQuests.map((quest) => quest.id)).map((quest) => `${quest.title} (${quest.category}, ${quest.time}, +${quest.points} pts)`).join("; ") || "none"}. Ask Sprout to recommend a fun, realistic next quest based on my time and progress, or turn one quest into a mini-adventure. Keep the suggestions safe, accessible, and on public campus paths/spaces.`;
  const sproutPrompt = sproutPick
    ? `Hey Sprout! Help me decide whether to do “${sproutPick.title}” or another TouchGrass quest. I have ${gardenScore} garden points and ${pointsNeeded} points until my next sprout. Suggest a fun way to do this quest and one optional bonus challenge.`
    : `Hey Sprout! I've completed all the current TouchGrass quests. Suggest a new, safe outdoor mini-adventure around UNC-Chapel Hill and help me keep growing my garden.`;

  return (
    <main className={styles.page}>
      <section className={styles.app} aria-labelledby="touchgrass-title">
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.brandCopy}>
              <p className={styles.eyebrow}>UNC campus breaks</p>
              <h1 id="touchgrass-title">TouchGrass.exe</h1>
            </div>
          </div>
          <div className={styles.scoreBox} aria-label={`Garden score ${gardenScore} points`}>
            <span>GARDEN PTS</span>
            <strong>{gardenScore}</strong>
          </div>
        </header>

        <section className={styles.summary} aria-label="Your progress">
          <div className={styles.summaryCard}><strong>{completedCount}</strong><span>Done</span></div>
          <div className={styles.summaryCard}><strong>{activeQuests.length}</strong><span>On your list</span></div>
          <div className={styles.summaryCard}><strong>{sprouts}</strong><span>Sprouts</span></div>
        </section>

        <section className={styles.gardenPanel} aria-label="Your garden">
          <div className={styles.gardenHeading}>
            <div>
              <p className={styles.panelEyebrow}>YOUR GARDEN</p>
              <h2>{sprouts === 0 ? "Grow your first sprout" : `Garden level ${sprouts}`}</h2>
            </div>
            <div className={styles.plantBadge}>{sprouts === 0 ? "SEED" : `LEVEL ${sprouts}`}</div>
          </div>
          <div className={styles.progressMeta}><span>Next sprout</span><strong>{pointsTowardNextSprout}/{POINTS_PER_SPROUT} pts</strong></div>
          <div className={styles.progressTrack} role="progressbar" aria-label="Progress toward next sprout" aria-valuemin={0} aria-valuemax={POINTS_PER_SPROUT} aria-valuenow={pointsTowardNextSprout}>
            <span className={styles.progressFill} style={{ width: `${sproutProgress}%` }} />
          </div>
          <p className={styles.nextSprout}>{pointsNeeded} pts to grow again.</p>
          <details className={styles.funFact}>
            <summary>Campus field note</summary>
            <p>{currentPlantFact}</p>
          </details>
        </section>

        <section className={styles.sproutCoach} aria-labelledby="sprout-coach-title">
          <div className={styles.sproutCoachCopy}>
            <p className={styles.panelEyebrow}>SPROUT RECOMMENDS</p>
            <h2 id="sprout-coach-title">{sproutPick ? sproutPick.title : "Pick a new adventure"}</h2>
            <p className={styles.sproutQuickMeta}>{sproutPick ? `${sproutPick.time} · +${sproutPick.points} pts` : "All current quests complete."}</p>
            <div className={styles.sproutButtonWrap}>
              <SendToSproutButton appId="touchgrass" text={sproutPrompt} context={sproutContext} />
            </div>
          </div>
        </section>

        <div className={styles.questToolbar}>
          <div className={styles.sectionHeading}>
            <h2>Choose a quest</h2>
            <span>{visibleQuests.length} shown</span>
          </div>
          <button className={styles.secondaryButton} type="button" onClick={surpriseMe}>
            Surprise me
          </button>
        </div>

        <div className={styles.filterRow} aria-label="Filter quests">
          {(["All", "Nature", "Landmark", "Creative", "Mindful", "Adventure"] as QuestFilter[]).map((category) => (
            <button key={category} type="button" className={`${styles.filterButton} ${filter === category ? styles.filterButtonActive : ""}`} aria-pressed={filter === category} onClick={() => setFilter(category)}>{category}</button>
          ))}
        </div>

        {celebration && <p className={styles.celebration} role="status">{celebration}</p>}

        {visibleQuests.length > 0 ? (
          <section className={styles.questList} aria-label="Available campus quests">
            {visibleQuests.map((quest) => (
              <article className={styles.questCard} key={quest.id}>
                <div className={styles.questInfo}>
                  <div className={styles.questTitleRow}><h3>{quest.title}</h3><span className={styles.categoryTag}>{quest.category}</span></div>
                  <p>{quest.description}</p>
                  <div className={styles.questMeta}>{quest.time}</div>
                  <details className={styles.bonusDetails}><summary>Quest details</summary><p><strong>Where:</strong> {quest.location}</p><p><strong>Bonus:</strong> {quest.bonusChallenge}</p></details>
                </div>
                <div className={styles.questActions}>
                  <span className={styles.points}>+{quest.points} pts</span>
                  <button className={styles.completeButton} type="button" onClick={() => completeQuest(quest.id)}>Done</button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className={styles.emptyState}>
            <h3>{allQuestsComplete ? "Quest board cleared!" : `No ${filter.toLowerCase()} quests on your list`}</h3>
            <p>{allQuestsComplete ? "Try Campus Bingo or ask Sprout for another idea." : "Try another filter or pick a surprise quest."}</p>
            <button className={styles.secondaryButton} type="button" onClick={() => setFilter("All")}>Show all</button>
          </div>
        )}

        <section className={styles.bingoSection} aria-labelledby="bingo-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.panelEyebrow}>SIDE QUEST</p><h2 id="bingo-title">Campus Bingo</h2></div>
            <span>{completedBingoCount}/9 · {completedBingoLines.length} lines</span>
          </div>
          <p className={styles.bingoIntro}>Square: +5 pts <span aria-hidden="true">·</span> New line: +10 bonus</p>
          <div className={styles.bingoGrid}>
            {bingoSquares.map((square) => {
              const isDone = completedBingoIds.includes(square.id);
              const isCenter = square.id === "free";
              return (
                <button key={square.id} type="button" title={square.detail} aria-label={`${square.title}. ${square.detail}${isDone ? ". Completed" : ". Complete for 5 points"}`} className={`${styles.bingoSquare} ${isDone ? styles.bingoSquareDone : ""} ${isCenter ? styles.bingoSquareCenter : ""}`} aria-pressed={isDone} onClick={() => completeBingoSquare(square.id)} disabled={isDone}>
                  <strong>{square.title}</strong>
                  <small>{isDone ? "Done" : "+5 pts"}</small>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.badgesSection} aria-labelledby="badges-title">
          <div className={styles.sectionHeading}>
            <div><p className={styles.panelEyebrow}>MILESTONES</p><h2 id="badges-title">Badges</h2></div>
            <span>{unlockedBadges.length}/{badgeDefinitions.length}</span>
          </div>
          <div className={styles.badgeGrid}>
            {badgeDefinitions.map((badge) => {
              const isUnlocked = unlockedBadges.some((unlocked) => unlocked.id === badge.id);
              return (
                <div key={badge.id} className={`${styles.badgeCard} ${isUnlocked ? styles.badgeCardUnlocked : styles.badgeCardLocked}`}>
                  <div><strong>{badge.title}</strong><p>{isUnlocked ? "Unlocked" : "Locked"}</p></div>
                </div>
              );
            })}
          </div>
          {nextBadge && <p className={styles.nextBadge}>Next badge: <strong>{nextBadge.title}</strong></p>}
        </section>

        <footer className={styles.footer}>
          <span>Take a break, Tar Heel.</span>
        </footer>
      </section>
    </main>
  );
}

