import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

type WatchType = "Movie" | "Series" | "Either";
type Platform = "Netflix" | "Prime Video" | "Both";
type MediaType = "movie" | "tv";

type Preferences = {
  genre: string;
  type: WatchType;
  platform: Platform;
  mood: string;

  watchedIds?: string[];
  recentlyShownIds?: string[];
};

type TMDBItem = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  release_date?: string;
  first_air_date?: string;
};

type Recommendation = {
  id: number;
  type: MediaType;
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
   GENRES
========================================================= */

const GENRES: Record<
  string,
  {
    movie?: number;
    tv?: number;
  }
> = {
  Thriller: {
    movie: 53,
    tv: 9648,
  },

  Comedy: {
    movie: 35,
    tv: 35,
  },

  Romance: {
    movie: 10749,
    tv: 18,
  },

  Horror: {
    movie: 27,
    tv: 9648,
  },

  Crime: {
    movie: 80,
    tv: 80,
  },

  "Sci-Fi": {
    movie: 878,
    tv: 10765,
  },

  Action: {
    movie: 28,
    tv: 10759,
  },

  Drama: {
    movie: 18,
    tv: 18,
  },

  Mystery: {
    movie: 9648,
    tv: 9648,
  },

  "Feel Good": {
    movie: 35,
    tv: 35,
  },

  Anime: {
    movie: 16,
    tv: 16,
  },

  Documentary: {
    movie: 99,
    tv: 99,
  },
};

/* =========================================================
   PROVIDERS
========================================================= */

const NETFLIX_PROVIDER_ID = 8;
const PRIME_VIDEO_PROVIDER_ID = 119;

function getProviderFilter(platform: Platform) {
  if (platform === "Netflix") {
    return String(NETFLIX_PROVIDER_ID);
  }

  if (platform === "Prime Video") {
    return String(PRIME_VIDEO_PROVIDER_ID);
  }

  return `${NETFLIX_PROVIDER_ID}|${PRIME_VIDEO_PROVIDER_ID}`;
}

/* =========================================================
   MAANUS SCORE
========================================================= */

function calculateMaanusScore(
  item: TMDBItem,
  mood: string
) {
  const rating = item.vote_average ?? 0;
  const voteCount = item.vote_count ?? 0;
  const popularity = item.popularity ?? 0;

  const ratingScore = rating * 10;

  const confidenceScore =
    Math.min(
      Math.log10(voteCount + 1) / 5,
      1
    ) * 100;

  const popularityScore =
    Math.min(
      popularity / 150,
      1
    ) * 100;

  let moodBoost = 0;

  if (mood === "Keep Me Hooked") {
    moodBoost =
      Math.min(
        popularity / 250,
        1
      ) * 8;
  }

  if (mood === "Pure Entertainment") {
    moodBoost =
      Math.min(
        popularity / 250,
        1
      ) * 8;
  }

  if (
    mood === "Mind Bending" &&
    rating >= 7
  ) {
    moodBoost = 6;
  }

  if (
    mood === "Emotional" &&
    rating >= 7.2
  ) {
    moodBoost = 6;
  }

  if (
    mood === "Make Me Laugh" &&
    rating >= 6.5
  ) {
    moodBoost = 5;
  }

  if (
    mood === "Easy Watch" &&
    rating >= 6.5
  ) {
    moodBoost = 5;
  }

  const score =
    ratingScore * 0.5 +
    confidenceScore * 0.3 +
    popularityScore * 0.2 +
    moodBoost;

  return Math.min(
    99,
    Math.max(
      1,
      Math.round(score)
    )
  );
}

/* =========================================================
   DISCOVER
========================================================= */

async function discoverTitles(
  mediaType: MediaType,
  preferences: Preferences
): Promise<Recommendation[]> {
  const token =
    process.env.TMDB_ACCESS_TOKEN;

  if (!token) {
    throw new Error(
      "TMDB_ACCESS_TOKEN is missing from .env.local"
    );
  }

  const genreId =
    preferences.genre === "Surprise Me"
      ? undefined
      : GENRES[preferences.genre]?.[
          mediaType
        ];

  const allItems: TMDBItem[] = [];

  /*
    We fetch 5 pages so Maanus has
    a larger candidate pool to choose from.
  */

  for (
    let page = 1;
    page <= 5;
    page++
  ) {
    const params =
      new URLSearchParams();

    params.set(
      "language",
      "en-US"
    );

    params.set(
      "page",
      String(page)
    );

    params.set(
      "watch_region",
      "IN"
    );

    params.set(
      "with_watch_monetization_types",
      "flatrate"
    );

    params.set(
      "with_watch_providers",
      getProviderFilter(
        preferences.platform
      )
    );

    params.set(
      "vote_count.gte",
      "50"
    );

    params.set(
      "sort_by",
      "popularity.desc"
    );

    if (genreId) {
      params.set(
        "with_genres",
        String(genreId)
      );
    }

    const url =
      `${TMDB_BASE_URL}/discover/${mediaType}?${params.toString()}`;

    const response =
      await fetch(url, {
        headers: {
          Authorization:
            `Bearer ${token}`,
          Accept:
            "application/json",
        },

        cache: "no-store",
      });

    if (!response.ok) {
      const text =
        await response.text();

      console.error(
        "TMDB ERROR:",
        response.status,
        text
      );

      throw new Error(
        `TMDB returned status ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      Array.isArray(
        data.results
      )
    ) {
      allItems.push(
        ...data.results
      );
    }
  }

  return allItems

    .filter((item) => {
      const rating =
        item.vote_average ?? 0;

      const votes =
        item.vote_count ?? 0;

      return (
        Boolean(item.id) &&
        Boolean(item.overview) &&
        Boolean(item.poster_path) &&
        rating >= 5.8 &&
        votes >= 50
      );
    })

    .map((item) => {
      const date =
        mediaType === "movie"
          ? item.release_date
          : item.first_air_date;

      const title =
        mediaType === "movie"
          ? item.title
          : item.name;

      return {
        id: item.id,

        type: mediaType,

        title:
          title || "Untitled",

        overview:
          item.overview ||
          "No description available.",

        poster:
          item.poster_path
            ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
            : null,

        backdrop:
          item.backdrop_path
            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
            : null,

        rating:
          Number(
            (
              item.vote_average ?? 0
            ).toFixed(1)
          ),

        voteCount:
          item.vote_count ?? 0,

        popularity:
          item.popularity ?? 0,

        year:
          date
            ? date.slice(0, 4)
            : "—",

        maanusScore:
          calculateMaanusScore(
            item,
            preferences.mood
          ),
      };
    });
}

/* =========================================================
   WEIGHTED RANDOM SELECTION
========================================================= */

function weightedRandomFive(
  candidates: Recommendation[]
) {
  const pool = [
    ...candidates,
  ];

  const chosen: Recommendation[] = [];

  while (
    pool.length > 0 &&
    chosen.length < 5
  ) {
    /*
      Higher Maanus scores get a higher
      probability of being selected.

      We cube the score so high quality
      candidates are favoured strongly,
      while still allowing variation.
    */

    const weights =
      pool.map((item) =>
        Math.pow(
          item.maanusScore,
          3
        )
      );

    const totalWeight =
      weights.reduce(
        (sum, weight) =>
          sum + weight,
        0
      );

    let random =
      Math.random() *
      totalWeight;

    let selectedIndex = 0;

    for (
      let i = 0;
      i < weights.length;
      i++
    ) {
      random -= weights[i];

      if (random <= 0) {
        selectedIndex = i;
        break;
      }
    }

    chosen.push(
      pool[selectedIndex]
    );

    pool.splice(
      selectedIndex,
      1
    );
  }

  return chosen;
}

/* =========================================================
   TEST
========================================================= */

export async function GET() {
  return NextResponse.json({
    success: true,
    message:
      "Maanus API is working",
  });
}

/* =========================================================
   POST
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    const preferences =
      (await request.json()) as Preferences;

    if (
      !preferences.genre ||
      !preferences.type ||
      !preferences.platform ||
      !preferences.mood
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing recommendation preferences.",
        },
        {
          status: 400,
        }
      );
    }

    let recommendations:
      Recommendation[] = [];

    if (
      preferences.type ===
      "Movie"
    ) {
      recommendations =
        await discoverTitles(
          "movie",
          preferences
        );
    }

    if (
      preferences.type ===
      "Series"
    ) {
      recommendations =
        await discoverTitles(
          "tv",
          preferences
        );
    }

    if (
      preferences.type ===
      "Either"
    ) {
      const [
        movies,
        series,
      ] = await Promise.all([
        discoverTitles(
          "movie",
          preferences
        ),

        discoverTitles(
          "tv",
          preferences
        ),
      ]);

      recommendations = [
        ...movies,
        ...series,
      ];
    }

    /*
      Remove duplicate TMDB entries.
    */

    const uniqueMap =
      new Map<
        string,
        Recommendation
      >();

    recommendations.forEach(
      (item) => {
        const key =
          `${item.type}-${item.id}`;

        uniqueMap.set(
          key,
          item
        );
      }
    );

    let unique =
      Array.from(
        uniqueMap.values()
      );

    /*
      ALREADY WATCHED

      These are permanently excluded.
    */

    const watchedSet =
      new Set(
        preferences.watchedIds ??
          []
      );

    unique =
      unique.filter(
        (item) =>
          !watchedSet.has(
            `${item.type}-${item.id}`
          )
      );

    /*
      RECENTLY SHOWN

      These are excluded during
      the current browser session.
    */

    const recentlyShownSet =
      new Set(
        preferences.recentlyShownIds ??
          []
      );

    let freshCandidates =
      unique.filter(
        (item) =>
          !recentlyShownSet.has(
            `${item.type}-${item.id}`
          )
      );

    /*
      If we run out of fresh titles,
      allow previously shown titles again,
      but NEVER allow watched titles.
    */

    if (
      freshCandidates.length <
      5
    ) {
      freshCandidates =
        unique;
    }

    /*
      Rank candidates first.
    */

    freshCandidates.sort(
      (a, b) => {
        if (
          b.maanusScore !==
          a.maanusScore
        ) {
          return (
            b.maanusScore -
            a.maanusScore
          );
        }

        if (
          b.rating !==
          a.rating
        ) {
          return (
            b.rating -
            a.rating
          );
        }

        return (
          b.voteCount -
          a.voteCount
        );
      }
    );

    /*
      Don't randomise all 100 titles.

      Take the best 30, then perform
      weighted random selection.
    */

    const strongCandidates =
      freshCandidates.slice(
        0,
        30
      );

    const selected =
      weightedRandomFive(
        strongCandidates
      );

    return NextResponse.json({
      success: true,

      recommendations:
        selected,

      totalCandidates:
        freshCandidates.length,

      watchedFiltered:
        watchedSet.size,

      recentlyShownFiltered:
        recentlyShownSet.size,
    });
  } catch (error) {
    console.error(
      "MAANUS API ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown API error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}