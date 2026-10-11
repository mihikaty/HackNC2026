"use client";

import { useState } from "react";
import styles from "./TouchGrassApp.module.css";
import { SendToSproutButton } from "@/app/components/sprout/SendToSproutButton";

type Quest = {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
};

const QUESTS_VISIBLE_AT_ONCE = 4;

const questPool: Quest[] = [
  {
    id: "find-carolina-blue",
    title: "Find Carolina Blue",
    description: "Spot something Carolina blue outdoors on campus.",
    icon: "💙",
    points: 5,
  },
  {
    id: "visit-old-well",
    title: "Visit the Old Well",
    description:
      "Notice one detail near the Old Well that you have not seen before.",
    icon: "⛲",
    points: 5,
  },
  {
    id: "coker-arboretum",
    title: "Walk Through Coker Arboretum",
    description:
      "Take a short walk through the Arboretum and notice one plant.",
    icon: "🌿",
    points: 15,
  },
  {
    id: "new-campus-spot",
    title: "Explore a New Campus Spot",
    description:
      "Visit an outdoor UNC location you have not explored recently.",
    icon: "🧭",
    points: 20,
  },
  {
    id: "mccorkle-moment",
    title: "Take a McCorkle Moment",
    description:
      "Pause outside near McCorkle Place and notice three sounds.",
    icon: "🌳",
    points: 10,
  },
  {
    id: "bell-tower-sound-check",
    title: "Bell Tower Sound Check",
    description:
      "Spend a few minutes outside noticing sounds near the Bell Tower.",
    icon: "🔔",
    points: 10,
  },
  {
    id: "campus-color-collector",
    title: "Collect Campus Colors",
    description:
      "Find five different colors in the outdoor spaces around UNC.",
    icon: "🎨",
    points: 15,
  },
  {
    id: "carolina-sky-check",
    title: "Take a Carolina Sky Check",
    description:
      "Spend a few minutes outside noticing the sky, clouds, or sunlight.",
    icon: "☁️",
    points: 10,
  },
  {
    id: "battle-park-break",
    title: "Take a Battle Park Break",
    description:
      "Spend a short, comfortable outdoor break near Battle Park.",
    icon: "🍃",
    points: 20,
  },
  {
    id: "campus-tree-check",
    title: "Compare Three Campus Trees",
    description:
      "Notice how three campus trees differ in size, shape, or texture.",
    icon: "🌲",
    points: 15,
  },
  {
    id: "outdoor-reading-break",
    title: "Read Outside",
    description:
      "Read a few pages somewhere outdoors on or near campus.",
    icon: "📖",
    points: 15,
  },
  {
    id: "tar-heel-walk",
    title: "Take a Tar Heel Walk",
    description:
      "Take a relaxed walk through a campus path or green space.",
    icon: "🚶",
    points: 20,
  },
];

type PlantFact = {
  text: string;
  icon: string;
};

const plantFacts: PlantFact[] = [
  {
    icon: "🌳",
    text: "Coker Arboretum was created in 1903 and covers about five acres of UNC-Chapel Hill campus.",
  },
  {
    icon: "🌿",
    text: "Coker Arboretum contains more than 500 species of trees, plants, and shrubs.",
  },
  {
    icon: "🌱",
    text: "The North Carolina Botanical Garden is part of UNC-Chapel Hill and focuses on southeastern native plants.",
  },
  {
    icon: "🪴",
    text: "UNC’s Botanical Garden includes collections featuring native plants, water gardens, and carnivorous plants.",
  },
  {
    icon: "🪰",
    text: "Venus flytraps naturally grow only within a limited region near Wilmington, North Carolina.",
  },
  {
    icon: "🥕",
    text: "The Carolina Community Garden brings members of the UNC community together to grow and share produce.",
  },
  {
    icon: "🍃",
    text: "Battle Park is a forested natural area near campus that provides habitat for native plant and animal species.",
  },
];

function getRandomQuest(quests: Quest[]): Quest | null {
  if (quests.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * quests.length);

  return quests[randomIndex];
}

export default function TouchGrassApp() {
  const [activeQuests, setActiveQuests] = useState<Quest[]>(
    questPool.slice(0, QUESTS_VISIBLE_AT_ONCE),
  );

  const [completedQuestIds, setCompletedQuestIds] = useState<string[]>(
    [],
  );

  const [gardenScore, setGardenScore] = useState<number>(0);

  const sprouts = Math.floor(gardenScore / 20);

  const currentPlantFact =
    sprouts === 0
      ? {
         icon: "🌱",
         text: "Earn your first sprout by collecting 20 garden points.",
        }
      : plantFacts[(sprouts - 1) % plantFacts.length];


  const completedCount = completedQuestIds.length;

  const availablePoints = activeQuests.reduce(
    (total, quest) => total + quest.points,
    0,
  );

  const replacementQuestsAvailable = questPool.filter(
    (quest) =>
      !completedQuestIds.includes(quest.id) &&
      !activeQuests.some(
        (activeQuest) => activeQuest.id === quest.id,
      ),
  );

  function completeQuest(questId: string) {
    const completedQuest = activeQuests.find(
      (quest) => quest.id === questId,
    );

    if (!completedQuest) {
      return;
    }

    const nextCompletedQuestIds = [
      ...completedQuestIds,
      completedQuest.id,
    ];

    const replacementCandidates = questPool.filter(
      (quest) =>
        quest.id !== completedQuest.id &&
        !nextCompletedQuestIds.includes(quest.id) &&
        !activeQuests.some(
          (activeQuest) => activeQuest.id === quest.id,
        ),
    );

    const replacementQuest = getRandomQuest(
      replacementCandidates,
    );

    setGardenScore(
      (currentScore) => currentScore + completedQuest.points,
    );

    setCompletedQuestIds(nextCompletedQuestIds);

    setActiveQuests((currentQuests): Quest[] => {
      const remainingQuests = currentQuests.filter(
        (quest) => quest.id !== completedQuest.id,
      );

      if (replacementQuest === null) {
        return remainingQuests;
      }

      const updatedQuests: Quest[] = [
        ...remainingQuests,
        replacementQuest,
      ];

      return updatedQuests;
    });
  }

  const allQuestsComplete =
    activeQuests.length === 0 &&
    replacementQuestsAvailable.length === 0;

  return (
    <main className={styles.page}>
      <section
        className={styles.app}
        aria-labelledby="touchgrass-title"
      >
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <div className={styles.logo} aria-hidden="true">
              🌱
            </div>

            <div>
              <p className={styles.eyebrow}>
                UNC-Chapel Hill Outdoor Quests
              </p>

              <h1 id="touchgrass-title">TouchGrass.exe</h1>
            </div>
          </div>

          <div className={styles.scoreBox}>
            <span>Garden score</span>
            <strong>{gardenScore} pts</strong>
          </div>
        </header>

        <section
  className={styles.summary}
  aria-label="Quest summary"
>
  <div className={styles.summaryCard}>
    <strong>{completedCount}</strong>
    <span>Completed</span>
  </div>

  <div className={styles.summaryCard}>
    <strong>{activeQuests.length}</strong>
    <span>Active quests</span>
  </div>

  <div className={styles.summaryCard}>
    <strong>🌱 {sprouts}</strong>
    <span>Sprouts</span>
  </div>
</section>

<section
  className={styles.funFact}
  aria-live="polite"
  aria-label="UNC plant fun fact"
>
  <div className={styles.funFactIcon} aria-hidden="true">
    {currentPlantFact.icon}
  </div>

  <div>
    <p className={styles.funFactLabel}>
      {sprouts === 0 ? "Next sprout reward" : `Sprout ${sprouts} fact`}
    </p>

    <p className={styles.funFactText}>
      {currentPlantFact.text}
    </p>
  </div>
</section>

        <div className={styles.sectionHeading}>
          <h2>Today&apos;s Carolina quests</h2>
          <span>
            {allQuestsComplete
              ? "Quest pool complete!"
              : "Complete one to reshuffle"}
          </span>
        </div>

        {activeQuests.length > 0 ? (
          <section
            className={styles.questList}
            aria-label="UNC outdoor quests"
          >
            {activeQuests.map((quest) => (
              <article className={styles.questCard} key={quest.id}>
                <div
                  className={styles.questIcon}
                  aria-hidden="true"
                >
                  {quest.icon}
                </div>

                <div className={styles.questInfo}>
                  <h3>{quest.title}</h3>
                  <p>{quest.description}</p>
                </div>

                <div className={styles.points}>
                  +{quest.points} pts
                </div>

                <div className={styles.questActions}>
                  <button
                    className={styles.completeButton}
                    type="button"
                    onClick={() => completeQuest(quest.id)}
                  >
                    <span
                      className={styles.buttonShine}
                      aria-hidden="true"
                    />
                    Complete Quest
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🌎</div>
            <h3>All local quests complete!</h3>
            <p>
              You explored the entire TouchGrass.exe quest pool.
            </p>
          </div>
        )}

        <footer className={styles.footer}>
          <span aria-hidden="true">✦</span>
          Take a break, Tar Heel.
          <span aria-hidden="true">✦</span>
        </footer>
      </section>
    </main>
  );
}