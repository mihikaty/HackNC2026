


"use client";

import { useState } from "react";
import styles from "./TouchGrassApp.module.css";

type Quest = {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  completed: boolean;
};

const startingQuests: Quest[] = [
  {
    id: "carolina-blue",
    title: "Find Carolina Blue",
    description: "Spot something Carolina blue outdoors on campus.",
    icon: "💙",
    points: 5,
    completed: false,
  },
  {
    id: "old-well",
    title: "Visit the Old Well",
    description:
      "Stop by the Old Well and notice one detail you have not seen before.",
    icon: "⛲",
    points: 5,
    completed: false,
  },
  {
    id: "coker-arboretum",
    title: "Walk Through Coker Arboretum",
    description:
      "Take a short walk through the Arboretum and notice one plant.",
    icon: "🌿",
    points: 15,
    completed: false,
  },
  {
    id: "new-campus-spot",
    title: "Explore a New Campus Spot",
    description:
      "Visit an outdoor UNC location you have not explored recently.",
    icon: "🧭",
    points: 20,
    completed: false,
  },
];

export default function TouchGrassApp() {
  const [quests, setQuests] = useState<Quest[]>(startingQuests);
  const [gardenScore, setGardenScore] = useState(0);

  const completedCount = quests.filter(
    (quest) => quest.completed,
  ).length;

  const remainingCount = quests.length - completedCount;

  const availablePoints = quests
    .filter((quest) => !quest.completed)
    .reduce((total, quest) => total + quest.points, 0);

  function completeQuest(questId: string) {
    const selectedQuest = quests.find(
      (quest) => quest.id === questId,
    );

    if (!selectedQuest || selectedQuest.completed) {
      return;
    }

    setQuests((currentQuests) =>
      currentQuests.map((quest) =>
        quest.id === questId
          ? { ...quest, completed: true }
          : quest,
      ),
    );

    setGardenScore(
      (currentScore) => currentScore + selectedQuest.points,
    );
  }

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
            <strong>{remainingCount}</strong>
            <span>Remaining</span>
          </div>

          <div className={styles.summaryCard}>
            <strong>{availablePoints}</strong>
            <span>Available pts</span>
          </div>
        </section>

        <div className={styles.sectionHeading}>
          <h2>Today&apos;s Carolina quests</h2>

          <span>
            {remainingCount === 0
              ? "All quests complete!"
              : `${remainingCount} available`}
          </span>
        </div>

        <section
          className={styles.questList}
          aria-label="UNC outdoor quests"
        >
          {quests.map((quest) => (
            <article
              className={`${styles.questCard} ${
                quest.completed ? styles.completedQuest : ""
              }`}
              key={quest.id}
            >
              <div className={styles.questIcon} aria-hidden="true">
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
                  disabled={quest.completed}
                  onClick={() => completeQuest(quest.id)}
                >
                  <span
                    className={styles.buttonShine}
                    aria-hidden="true"
                  />

                  {quest.completed
                    ? "Completed"
                    : "Complete Quest"}
                </button>
              </div>
            </article>
          ))}
        </section>

        <footer className={styles.footer}>
          <span aria-hidden="true">✦</span>
          Take a break, Tar Heel.
          <span aria-hidden="true">✦</span>
        </footer>
      </section>
    </main>
  );
}