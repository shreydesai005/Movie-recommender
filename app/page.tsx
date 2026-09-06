"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Check,
  Coffee,
  Film,
  Heart,
  Laugh,
  MonitorPlay,
  Sparkles,
  Tv,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type Screen =
  | "landing"
  | "questions"
  | "loading"
  | "results";

type WatchType =
  | "Movie"
  | "Series"
  | "Either";

type Platform =
  | "Netflix"
  | "Prime Video"
  | "Both";

type Preferences = {
  genre: string | null;
  type: WatchType | null;
  platform: Platform | null;
  mood: string | null;
};

type Recommendation = {
  id: number;
  type: "movie" | "tv";
  title: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  voteCount: number;
  popularity: number;
  year: string;
  maanusScore: number;
};

/* =========================================================
   DATA
========================================================= */

const genres = [
  "Thriller",
  "Comedy",
  "Romance",
  "Horror",
  "Crime",
  "Sci-Fi",
  "Action",
  "Drama",
  "Mystery",
  "Feel Good",
  "Anime",
  "Documentary",
];

const moods = [
  {
    name: "Easy Watch",
    description:
      "Something relaxed and effortless.",
    icon: Coffee,
  },

  {
    name: "Mind Bending",
    description:
      "Make me think about it afterwards.",
    icon: Brain,
  },

  {
    name: "Make Me Laugh",
    description:
      "I need something genuinely funny.",
    icon: Laugh,
  },

  {
    name: "Keep Me Hooked",
    description:
      "No slow starts. Pull me in.",
    icon: Zap,
  },

  {
    name: "Emotional",
    description:
      "Something that actually makes me feel.",
    icon: Heart,
  },

  {
    name: "Pure Entertainment",
    description:
      "Big, fun and easy to enjoy.",
    icon: Film,
  },
];

/* =========================================================
   STORAGE KEYS
========================================================= */

const WATCHED_STORAGE_KEY =
  "maanus-watched";

const RECENT_STORAGE_KEY =
  "maanus-recently-shown";

/* =========================================================
   MAIN
========================================================= */

export default function Home() {
  const [
    screen,
    setScreen,
  ] =
    useState<Screen>(
      "landing"
    );

  const [
    question,
    setQuestion,
  ] =
    useState(1);

  const [
    preferences,
    setPreferences,
  ] =
    useState<Preferences>({
      genre: null,
      type: null,
      platform: null,
      mood: null,
    });

  const [
    recommendations,
    setRecommendations,
  ] =
    useState<
      Recommendation[]
    >([]);

  const [
    recommendationError,
    setRecommendationError,
  ] =
    useState<
      string | null
    >(null);

  const [
    watchedIds,
    setWatchedIds,
  ] =
    useState<string[]>(
      []
    );

  const [
    recentlyShownIds,
    setRecentlyShownIds,
  ] =
    useState<string[]>(
      []
    );

  /* =======================================================
     LOAD SAVED DATA
  ======================================================= */

  useEffect(() => {
    try {
      const savedWatched =
        localStorage.getItem(
          WATCHED_STORAGE_KEY
        );

      if (savedWatched) {
        const parsed =
          JSON.parse(
            savedWatched
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          setWatchedIds(
            parsed
          );
        }
      }

      const savedRecent =
        sessionStorage.getItem(
          RECENT_STORAGE_KEY
        );

      if (savedRecent) {
        const parsed =
          JSON.parse(
            savedRecent
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          setRecentlyShownIds(
            parsed
          );
        }
      }
    } catch (error) {
      console.error(
        "Could not load Maanus history:",
        error
      );
    }
  }, []);

  /* =======================================================
     HELPERS
  ======================================================= */

  function getRecommendationKey(
    item: Recommendation
  ) {
    return `${item.type}-${item.id}`;
  }

  function startExperience() {
    setQuestion(1);

    setScreen(
      "questions"
    );
  }

  function resetExperience() {
    setScreen(
      "landing"
    );

    setQuestion(1);

    setPreferences({
      genre: null,
      type: null,
      platform: null,
      mood: null,
    });

    setRecommendations(
      []
    );

    setRecommendationError(
      null
    );
  }

  function previousQuestion() {
    if (
      question > 1
    ) {
      setQuestion(
        (
          current
        ) =>
          current - 1
      );

      return;
    }

    setScreen(
      "landing"
    );
  }

  function canContinue() {
    if (
      question === 1
    ) {
      return (
        preferences.genre !==
        null
      );
    }

    if (
      question === 2
    ) {
      return (
        preferences.type !==
        null
      );
    }

    if (
      question === 3
    ) {
      return (
        preferences.platform !==
        null
      );
    }

    if (
      question === 4
    ) {
      return (
        preferences.mood !==
        null
      );
    }

    return false;
  }

  /* =======================================================
     FETCH RECOMMENDATIONS
  ======================================================= */

  async function fetchRecommendations(
    currentPreferences:
      Preferences
  ) {
    if (
      !currentPreferences.genre ||
      !currentPreferences.type ||
      !currentPreferences.platform ||
      !currentPreferences.mood
    ) {
      return;
    }

    try {
      setRecommendationError(
        null
      );

      setScreen(
        "loading"
      );

      const response =
        await fetch(
          "/api",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                genre:
                  currentPreferences.genre,

                type:
                  currentPreferences.type,

                platform:
                  currentPreferences.platform,

                mood:
                  currentPreferences.mood,

                watchedIds,

                recentlyShownIds,
              }),
          }
        );

      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        !contentType?.includes(
          "application/json"
        )
      ) {
        const text =
          await response.text();

        console.error(
          "Non JSON API response:",
          text
        );

        throw new Error(
          `API returned ${response.status} instead of JSON`
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `API error ${response.status}`
        );
      }

      if (
        !Array.isArray(
          data.recommendations
        )
      ) {
        throw new Error(
          "Invalid recommendation response."
        );
      }

      if (
        data.recommendations
          .length === 0
      ) {
        throw new Error(
          "Maanus couldn't find any fresh titles. Try another mood or genre."
        );
      }

      const newRecommendations:
        Recommendation[] =
        data.recommendations;

      setRecommendations(
        newRecommendations
      );

      /*
        Save everything just shown.

        Session storage means these
        won't be repeated easily during
        the same browsing session.
      */

      const newKeys =
        newRecommendations.map(
          (
            item
          ) =>
            getRecommendationKey(
              item
            )
        );

      const updatedRecent =
        Array.from(
          new Set([
            ...recentlyShownIds,
            ...newKeys,
          ])
        );

      /*
        Keep recent history from growing
        forever during very long sessions.
      */

      const trimmedRecent =
        updatedRecent.slice(
          -100
        );

      setRecentlyShownIds(
        trimmedRecent
      );

      sessionStorage.setItem(
        RECENT_STORAGE_KEY,
        JSON.stringify(
          trimmedRecent
        )
      );

      setScreen(
        "results"
      );
    } catch (
      error
    ) {
      console.error(
        "Recommendation error:",
        error
      );

      setRecommendationError(
        error instanceof Error
          ? error.message
          : "Unable to load recommendations."
      );

      setScreen(
        "results"
      );
    }
  }

  async function nextQuestion() {
    if (
      question < 4
    ) {
      setQuestion(
        (
          current
        ) =>
          current + 1
      );

      return;
    }

    await fetchRecommendations(
      preferences
    );
  }

  /* =======================================================
     ALREADY WATCHED
  ======================================================= */

  function markAsWatched(
    item: Recommendation
  ) {
    const key =
      getRecommendationKey(
        item
      );

    const updatedWatched =
      Array.from(
        new Set([
          ...watchedIds,
          key,
        ])
      );

    setWatchedIds(
      updatedWatched
    );

    localStorage.setItem(
      WATCHED_STORAGE_KEY,
      JSON.stringify(
        updatedWatched
      )
    );
  }

  return (
    <main className="app-shell">
      <div className="grain" />

      <AnimatePresence mode="wait">

        {screen ===
          "landing" && (
          <LandingScreen
            key="landing"
            onStart={
              startExperience
            }
          />
        )}

        {screen ===
          "questions" && (
          <motion.section
            key="questions"
            className="question-screen"
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -30,
            }}
          >
            <QuestionHeader
              question={
                question
              }
              onLogoClick={
                resetExperience
              }
            />

            <div className="question-wrapper">

              <AnimatePresence mode="wait">

                {question ===
                  1 && (
                  <GenreQuestion
                    key="genre"
                    selected={
                      preferences.genre
                    }
                    onSelect={(
                      genre
                    ) =>
                      setPreferences(
                        (
                          current
                        ) => ({
                          ...current,
                          genre,
                        })
                      )
                    }
                  />
                )}

                {question ===
                  2 && (
                  <TypeQuestion
                    key="type"
                    selected={
                      preferences.type
                    }
                    onSelect={(
                      type
                    ) =>
                      setPreferences(
                        (
                          current
                        ) => ({
                          ...current,
                          type,
                        })
                      )
                    }
                  />
                )}

                {question ===
                  3 && (
                  <PlatformQuestion
                    key="platform"
                    selected={
                      preferences.platform
                    }
                    onSelect={(
                      platform
                    ) =>
                      setPreferences(
                        (
                          current
                        ) => ({
                          ...current,
                          platform,
                        })
                      )
                    }
                  />
                )}

                {question ===
                  4 && (
                  <MoodQuestion
                    key="mood"
                    selected={
                      preferences.mood
                    }
                    onSelect={(
                      mood
                    ) =>
                      setPreferences(
                        (
                          current
                        ) => ({
                          ...current,
                          mood,
                        })
                      )
                    }
                  />
                )}

              </AnimatePresence>

              <div className="navigation-row">

                <button
                  className="back-button"
                  onClick={
                    previousQuestion
                  }
                >
                  <ArrowLeft
                    size={18}
                  />

                  BACK
                </button>

                <button
                  className={`continue-button-large ${
                    canContinue()
                      ? "active"
                      : ""
                  }`}
                  onClick={
                    nextQuestion
                  }
                  disabled={
                    !canContinue()
                  }
                >
                  {question ===
                  4
                    ? "FIND MY 5"
                    : "CONTINUE"}

                  <ArrowRight
                    size={20}
                  />
                </button>

              </div>
            </div>
          </motion.section>
        )}

        {screen ===
          "loading" && (
          <LoadingScreen
            key="loading"
          />
        )}

        {screen ===
          "results" && (
          <ResultsScreen
            key="results"
            recommendations={
              recommendations
            }
            error={
              recommendationError
            }
            onRestart={
              resetExperience
            }
            onWatched={
              markAsWatched
            }
            onRefresh={() =>
              fetchRecommendations(
                preferences
              )
            }
          />
        )}

      </AnimatePresence>
    </main>
  );
}

/* =========================================================
   LANDING
========================================================= */

function LandingScreen({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <motion.section
      className="landing-screen"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
    >
      <FloatingShapes />

      <nav className="top-nav">

        <div className="brand-small">
          MAANUS

          <span>
            SURPRISE
          </span>
        </div>

        <div className="platform-text">
          NETFLIX • PRIME VIDEO • INDIA
        </div>

      </nav>

      <div className="hero-content">

        <motion.p
          className="eyebrow"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          YOUR PERSONAL WATCHLIST CURATOR
        </motion.p>

        <div className="hero-title">

          <motion.h1
            initial={{
              opacity: 0,
              y: 80,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            MAANUS
          </motion.h1>

          <motion.div
            className="surprise-row"
            initial={{
              opacity: 0,
              y: 80,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
          >
            <span className="star">
              *
            </span>

            <h1>
              SURPRISE
            </h1>
          </motion.div>

        </div>

        <div className="hero-bottom">

          <div className="hero-description">

            <p>
              STOP SCROLLING.
              <br />
              START WATCHING.
            </p>

            <span>
              5 picks.
              <br />
              Your mood.
              <br />
              Tonight sorted.
            </span>

          </div>

          <motion.button
            className="surprise-button"
            onClick={
              onStart
            }
            whileHover={{
              scale: 1.05,
              rotate: -2,
            }}
            whileTap={{
              scale: 0.95,
            }}
          >
            SURPRISE ME

            <ArrowRight
              size={25}
            />
          </motion.button>

        </div>
      </div>

      <div className="scroll-label">

        <span>
          01
        </span>

        <div />

        <span>
          DISCOVER
        </span>

      </div>
    </motion.section>
  );
}

/* =========================================================
   HEADER
========================================================= */

function QuestionHeader({
  question,
  onLogoClick,
}: {
  question: number;
  onLogoClick: () => void;
}) {
  return (
    <header className="genre-header">

      <button
        className="logo-button"
        onClick={
          onLogoClick
        }
      >
        MAANUS

        <span>
          SURPRISE
        </span>
      </button>

      <div className="progress-wrapper">

        <div className="progress-bar">

          <motion.div
            className="progress-fill"
            animate={{
              width:
                `${question * 25}%`,
            }}
          />

        </div>

        <div className="question-number">
          {String(
            question
          ).padStart(
            2,
            "0"
          )}{" "}
          / 04
        </div>

      </div>
    </header>
  );
}

/* =========================================================
   GENRE
========================================================= */

function GenreQuestion({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect:
    (genre: string) => void;
}) {
  return (
    <QuestionAnimation>

      <QuestionTitle
        eyebrow="FIRST THINGS FIRST"
        lineOne="WHAT ARE WE"
        lineTwo="FEELING TONIGHT?"
      />

      <div className="genre-grid">

        {genres.map(
          (
            genre,
            index
          ) => (
            <motion.button
              key={
                genre
              }
              className={`genre-card ${
                selected ===
                genre
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onSelect(
                  genre
                )
              }
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.025,
              }}
            >
              <span className="genre-number">
                {String(
                  index +
                    1
                ).padStart(
                  2,
                  "0"
                )}
              </span>

              <span className="genre-name">
                {genre}
              </span>

              <ArrowRight
                size={20}
              />

            </motion.button>
          )
        )}

      </div>

      <button
        className={`random-choice ${
          selected ===
          "Surprise Me"
            ? "random-selected"
            : ""
        }`}
        onClick={() =>
          onSelect(
            "Surprise Me"
          )
        }
      >
        <Sparkles
          size={17}
        />

        I DON&apos;T KNOW — SURPRISE ME
      </button>

    </QuestionAnimation>
  );
}

/* =========================================================
   TYPE
========================================================= */

function TypeQuestion({
  selected,
  onSelect,
}: {
  selected:
    WatchType | null;

  onSelect:
    (type: WatchType) => void;
}) {
  const options = [
    {
      name:
        "Movie" as WatchType,
      description:
        "One story. One sitting. Tonight.",
      icon: Film,
    },

    {
      name:
        "Series" as WatchType,
      description:
        "Give me something worth getting addicted to.",
      icon: Tv,
    },

    {
      name:
        "Either" as WatchType,
      description:
        "I trust Maanus. Pick whatever is better.",
      icon: Sparkles,
    },
  ];

  return (
    <QuestionAnimation>

      <QuestionTitle
        eyebrow="FORMAT"
        lineOne="WHAT ARE WE"
        lineTwo="WATCHING?"
      />

      <div className="big-choice-grid">

        {options.map(
          (
            option,
            index
          ) => {
            const Icon =
              option.icon;

            return (
              <motion.button
                key={
                  option.name
                }
                className={`big-choice-card ${
                  selected ===
                  option.name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  onSelect(
                    option.name
                  )
                }
                initial={{
                  opacity: 0,
                  y: 30,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.08,
                }}
              >
                <div className="choice-top">

                  <span>
                    {String(
                      index +
                        1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <Icon
                    size={30}
                    strokeWidth={
                      1.4
                    }
                  />

                </div>

                <div>

                  <h3>
                    {option.name}
                  </h3>

                  <p>
                    {option.description}
                  </p>

                </div>

                <ArrowRight className="choice-arrow" />

              </motion.button>
            );
          }
        )}

      </div>
    </QuestionAnimation>
  );
}

/* =========================================================
   PLATFORM
========================================================= */

function PlatformQuestion({
  selected,
  onSelect,
}: {
  selected:
    Platform | null;

  onSelect:
    (platform: Platform) => void;
}) {
  const platforms = [
    {
      name:
        "Netflix" as Platform,
      description:
        "Only show me picks available on Netflix India.",
    },

    {
      name:
        "Prime Video" as Platform,
      description:
        "Only show me picks available on Prime Video India.",
    },

    {
      name:
        "Both" as Platform,
      description:
        "Search both and find the strongest options.",
    },
  ];

  return (
    <QuestionAnimation>

      <QuestionTitle
        eyebrow="STREAMING"
        lineOne="WHERE CAN YOU"
        lineTwo="WATCH?"
      />

      <div className="platform-grid">

        {platforms.map(
          (
            platform,
            index
          ) => (
            <motion.button
              key={
                platform.name
              }
              className={`platform-card ${
                selected ===
                platform.name
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onSelect(
                  platform.name
                )
              }
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay:
                  index *
                  0.08,
              }}
            >
              <div className="platform-symbol">

                {platform.name ===
                  "Netflix" &&
                  "N"}

                {platform.name ===
                  "Prime Video" && (
                  <MonitorPlay
                    size={42}
                    strokeWidth={
                      1.3
                    }
                  />
                )}

                {platform.name ===
                  "Both" &&
                  "N + P"}

              </div>

              <div>

                <h3>
                  {platform.name}
                </h3>

                <p>
                  {platform.description}
                </p>

              </div>

              <ArrowRight className="platform-arrow" />

            </motion.button>
          )
        )}

      </div>

      <div className="india-notice">

        <span>
          INDIA CATALOGUE
        </span>

        Results are filtered for Indian streaming availability.

      </div>
    </QuestionAnimation>
  );
}

/* =========================================================
   MOOD
========================================================= */

function MoodQuestion({
  selected,
  onSelect,
}: {
  selected:
    string | null;

  onSelect:
    (mood: string) => void;
}) {
  return (
    <QuestionAnimation>

      <QuestionTitle
        eyebrow="FINAL QUESTION"
        lineOne="WHAT KIND OF"
        lineTwo="EXPERIENCE?"
      />

      <div className="mood-grid">

        {moods.map(
          (
            mood,
            index
          ) => {
            const Icon =
              mood.icon;

            return (
              <motion.button
                key={
                  mood.name
                }
                className={`mood-card ${
                  selected ===
                  mood.name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  onSelect(
                    mood.name
                  )
                }
                initial={{
                  opacity: 0,
                  y: 20,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay:
                    index *
                    0.05,
                }}
              >
                <div className="mood-icon">

                  <Icon
                    size={26}
                    strokeWidth={
                      1.4
                    }
                  />

                </div>

                <h3>
                  {mood.name}
                </h3>

                <p>
                  {mood.description}
                </p>

                <ArrowRight className="mood-arrow" />

              </motion.button>
            );
          }
        )}

      </div>
    </QuestionAnimation>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  const messages = [
    "READING THE MOOD",
    "SEARCHING INDIA",
    "REMOVING WHAT YOU'VE WATCHED",
    "RANKING THE GOOD STUFF",
    "CHOOSING YOUR FIVE",
  ];

  return (
    <motion.section
      className="maanus-loading"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
    >

      <motion.div
        className="loading-star"
        animate={{
          rotate: 360,
          scale:
            [
              1,
              1.15,
              1,
            ],
        }}
        transition={{
          rotate: {
            duration: 3,
            repeat:
              Infinity,
            ease:
              "linear",
          },
        }}
      >
        *
      </motion.div>

      <p>
        MAANUS IS THINKING
      </p>

      <div className="loading-messages">

        {messages.map(
          (
            message,
            index
          ) => (
            <motion.span
              key={
                message
              }
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay:
                  index *
                  0.15,
              }}
            >
              {message}
            </motion.span>
          )
        )}

      </div>
    </motion.section>
  );
}

/* =========================================================
   RESULTS
========================================================= */

function ResultsScreen({
  recommendations,
  error,
  onRestart,
  onWatched,
  onRefresh,
}: {
  recommendations:
    Recommendation[];

  error:
    string | null;

  onRestart:
    () => void;

  onWatched:
    (
      item:
        Recommendation
    ) => void;

  onRefresh:
    () => void;
}) {
  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  const [
    visibleRecommendations,
    setVisibleRecommendations,
  ] =
    useState<
      Recommendation[]
    >(
      recommendations
    );

  useEffect(() => {
    setVisibleRecommendations(
      recommendations
    );

    setActiveIndex(
      0
    );
  }, [
    recommendations,
  ]);

  if (
    error ||
    visibleRecommendations.length ===
      0
  ) {
    return (
      <section className="results-error">

        <Sparkles
          size={30}
        />

        <h1>
          MAANUS GOT
          <br />
          CONFUSED.
        </h1>

        <p>
          {error ||
            "No recommendations left in this set."}
        </p>

        <button
          onClick={
            onRefresh
          }
        >
          FIND 5 MORE
        </button>

        <button
          onClick={
            onRestart
          }
        >
          START AGAIN
        </button>

      </section>
    );
  }

  const item =
    visibleRecommendations[
      activeIndex
    ];

  function nextMovie() {
    setActiveIndex(
      (
        current
      ) =>
        current ===
        visibleRecommendations.length -
          1
          ? 0
          : current +
            1
    );
  }

  function previousMovie() {
    setActiveIndex(
      (
        current
      ) =>
        current ===
        0
          ? visibleRecommendations.length -
            1
          : current -
            1
    );
  }

  function handleWatched() {
    onWatched(
      item
    );

    const updated =
      visibleRecommendations.filter(
        (
          recommendation
        ) =>
          !(
            recommendation.id ===
              item.id &&
            recommendation.type ===
              item.type
          )
      );

    setVisibleRecommendations(
      updated
    );

    if (
      updated.length === 0
    ) {
      setActiveIndex(
        0
      );

      return;
    }

    if (
      activeIndex >=
      updated.length
    ) {
      setActiveIndex(
        0
      );
    }
  }

  const backgroundStyle =
    item.backdrop
      ? {
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(10,10,9,0.98) 0%,
              rgba(10,10,9,0.88) 40%,
              rgba(10,10,9,0.45) 75%,
              rgba(10,10,9,0.70) 100%
            ),
            url("${item.backdrop}")
          `,
        }
      : undefined;

  return (
    <section className="results-screen">

      <AnimatePresence mode="wait">

        <motion.div
          key={`${item.type}-${item.id}`}
          className="result-background"
          style={
            backgroundStyle
          }
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          exit={{
            opacity: 0,
          }}
        >

          <header className="result-header">

            <button
              className="logo-button"
              onClick={
                onRestart
              }
            >
              MAANUS

              <span>
                SURPRISE
              </span>
            </button>

            <div className="result-count">
              {String(
                activeIndex +
                  1
              ).padStart(
                2,
                "0"
              )}
              {" / "}
              {String(
                visibleRecommendations.length
              ).padStart(
                2,
                "0"
              )}
            </div>

          </header>

          <div className="result-content">

            <motion.div
              className="result-copy"
              initial={{
                opacity: 0,
                x: -30,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
            >

              <p className="maanus-pick">
                MAANUS PICK #
                {activeIndex +
                  1}
              </p>

              <div className="result-metadata">

                <span>
                  {item.type ===
                  "movie"
                    ? "MOVIE"
                    : "SERIES"}
                </span>

                <span>
                  •
                </span>

                <span>
                  {item.year}
                </span>

                <span>
                  •
                </span>

                <span>
                  ★ {item.rating}
                </span>

              </div>

              <h1>
                {item.title}
              </h1>

              <div className="score-section">

                <strong>
                  {item.maanusScore}%
                </strong>

                <span>
                  MAANUS
                  <br />
                  MATCH
                </span>

              </div>

              <p className="movie-overview">
                {item.overview}
              </p>

              <div className="result-buttons">

                <button
                  className="primary-result-button"
                  onClick={
                    nextMovie
                  }
                >
                  NEXT PICK

                  <ArrowRight
                    size={19}
                  />
                </button>

                <button
                  className="secondary-result-button"
                  onClick={
                    handleWatched
                  }
                >
                  <Check
                    size={18}
                  />

                  ALREADY WATCHED
                </button>

                <button
                  className="secondary-result-button"
                  onClick={
                    onRefresh
                  }
                >
                  <Sparkles
                    size={18}
                  />

                  SURPRISE ME AGAIN
                </button>

                <button
                  className="secondary-result-button"
                  onClick={
                    onRestart
                  }
                >
                  CHANGE MY MOOD
                </button>

              </div>

            </motion.div>

            {item.poster && (
              <motion.div
                className="result-poster-wrapper"
                initial={{
                  opacity: 0,
                  x: 50,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
              >

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    item.poster
                  }
                  alt={
                    item.title
                  }
                  className="result-poster"
                />

                <div className="poster-score">
                  {item.maanusScore}%
                </div>

              </motion.div>
            )}

          </div>

          <div className="result-navigation">

            <button
              onClick={
                previousMovie
              }
            >
              <ArrowLeft
                size={18}
              />

              PREVIOUS
            </button>

            <div className="result-dots">

              {visibleRecommendations.map(
                (
                  recommendation,
                  index
                ) => (
                  <button
                    key={`${recommendation.type}-${recommendation.id}`}
                    className={
                      activeIndex ===
                      index
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setActiveIndex(
                        index
                      )
                    }
                  >
                    {String(
                      index +
                        1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </button>
                )
              )}

            </div>

            <button
              onClick={
                nextMovie
              }
            >
              NEXT

              <ArrowRight
                size={18}
              />
            </button>

          </div>

        </motion.div>

      </AnimatePresence>

      <div className="justwatch-credit">
        Streaming availability powered by JustWatch via TMDB
      </div>

    </section>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function QuestionTitle({
  eyebrow,
  lineOne,
  lineTwo,
}: {
  eyebrow: string;
  lineOne: string;
  lineTwo: string;
}) {
  return (
    <div className="genre-heading">

      <p>
        {eyebrow}
      </p>

      <h2>
        {lineOne}

        <br />

        <em>
          {lineTwo}
        </em>
      </h2>

    </div>
  );
}

function QuestionAnimation({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 25,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: -25,
      }}
    >
      {children}
    </motion.div>
  );
}

function FloatingShapes() {
  return (
    <div className="floating-layer">

      <motion.div
        className="floating-card card-one"
        animate={{
          y:
            [
              0,
              -15,
              0,
            ],
          rotate:
            [
              -8,
              -5,
              -8,
            ],
        }}
        transition={{
          duration: 7,
          repeat:
            Infinity,
          ease:
            "easeInOut",
        }}
      >
        <span>
          01
        </span>

        <div className="poster-placeholder poster-one">
          <p>
            CRIME
          </p>
        </div>
      </motion.div>

      <motion.div
        className="floating-card card-two"
        animate={{
          y:
            [
              0,
              18,
              0,
            ],
          rotate:
            [
              7,
              10,
              7,
            ],
        }}
        transition={{
          duration: 8,
          repeat:
            Infinity,
          ease:
            "easeInOut",
        }}
      >
        <span>
          02
        </span>

        <div className="poster-placeholder poster-two">
          <p>
            SCI-FI
          </p>
        </div>
      </motion.div>

      <motion.div
        className="orb orb-one"
        animate={{
          x:
            [
              0,
              30,
              0,
            ],
          y:
            [
              0,
              -20,
              0,
            ],
        }}
        transition={{
          duration: 9,
          repeat:
            Infinity,
        }}
      />

      <motion.div
        className="orb orb-two"
        animate={{
          x:
            [
              0,
              -25,
              0,
            ],
          y:
            [
              0,
              30,
              0,
            ],
        }}
        transition={{
          duration: 11,
          repeat:
            Infinity,
        }}
      />

    </div>
  );
}