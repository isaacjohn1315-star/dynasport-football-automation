export type Competition = {
  id: number;
  name: string;
  country: string;
  priority: "high" | "major" | "international" | "other";
};

export const COMPETITIONS: Competition[] = [
  // 🇳🇬 Nigeria / Africa — highest priority
  {
    id: 399,
    name: "Nigeria Professional Football League",
    country: "Nigeria",
    priority: "high",
  },

  // 🏴 England
  {
    id: 39,
    name: "Premier League",
    country: "England",
    priority: "high",
  },
  {
    id: 40,
    name: "Championship",
    country: "England",
    priority: "major",
  },
  {
    id: 41,
    name: "League One",
    country: "England",
    priority: "major",
  },
  {
    id: 42,
    name: "League Two",
    country: "England",
    priority: "major",
  },
  {
    id: 45,
    name: "FA Cup",
    country: "England",
    priority: "major",
  },
  {
    id: 48,
    name: "EFL Cup",
    country: "England",
    priority: "major",
  },
  {
    id: 528,
    name: "Community Shield",
    country: "England",
    priority: "major",
  },

  // 🇪🇸 Spain
  {
    id: 140,
    name: "La Liga",
    country: "Spain",
    priority: "high",
  },
  {
    id: 141,
    name: "Segunda División",
    country: "Spain",
    priority: "major",
  },
  {
    id: 143,
    name: "Copa del Rey",
    country: "Spain",
    priority: "major",
  },

  // 🇮🇹 Italy
  {
    id: 135,
    name: "Serie A",
    country: "Italy",
    priority: "high",
  },
  {
    id: 136,
    name: "Serie B",
    country: "Italy",
    priority: "major",
  },
  {
    id: 137,
    name: "Coppa Italia",
    country: "Italy",
    priority: "major",
  },

  // 🇩🇪 Germany
  {
    id: 78,
    name: "Bundesliga",
    country: "Germany",
    priority: "high",
  },
  {
    id: 79,
    name: "2. Bundesliga",
    country: "Germany",
    priority: "major",
  },
  {
    id: 81,
    name: "DFB-Pokal",
    country: "Germany",
    priority: "major",
  },

  // 🇫🇷 France
  {
    id: 61,
    name: "Ligue 1",
    country: "France",
    priority: "high",
  },
  {
    id: 62,
    name: "Ligue 2",
    country: "France",
    priority: "major",
  },
  {
    id: 66,
    name: "Coupe de France",
    country: "France",
    priority: "major",
  },

  // 🇵🇹 Portugal
  {
    id: 94,
    name: "Primeira Liga",
    country: "Portugal",
    priority: "major",
  },
  {
    id: 95,
    name: "Segunda Liga",
    country: "Portugal",
    priority: "major",
  },
  {
    id: 96,
    name: "Taça de Portugal",
    country: "Portugal",
    priority: "major",
  },

  // 🇪🇺 UEFA
  {
    id: 2,
    name: "UEFA Champions League",
    country: "Europe",
    priority: "high",
  },
  {
    id: 3,
    name: "UEFA Europa League",
    country: "Europe",
    priority: "high",
  },
  {
    id: 848,
    name: "UEFA Conference League",
    country: "Europe",
    priority: "high",
  },

  // 🌎 Other major leagues
  {
    id: 253,
    name: "MLS",
    country: "USA",
    priority: "other",
  },
  {
    id: 262,
    name: "Liga MX",
    country: "Mexico",
    priority: "other",
  },
  {
    id: 71,
    name: "Brasileirão Série A",
    country: "Brazil",
    priority: "other",
  },
  {
    id: 128,
    name: "Argentine Primera División",
    country: "Argentina",
    priority: "other",
  },
  {
    id: 307,
    name: "Saudi Pro League",
    country: "Saudi Arabia",
    priority: "other",
  },
  {
    id: 98,
    name: "J1 League",
    country: "Japan",
    priority: "other",
  },
  {
    id: 292,
    name: "K League 1",
    country: "South Korea",
    priority: "other",
  },
  {
    id: 88,
    name: "Eredivisie",
    country: "Netherlands",
    priority: "other",
  },
  {
    id: 144,
    name: "Belgian Pro League",
    country: "Belgium",
    priority: "other",
  },
  {
    id: 179,
    name: "Scottish Premiership",
    country: "Scotland",
    priority: "other",
  },
  {
    id: 203,
    name: "Turkish Süper Lig",
    country: "Turkey",
    priority: "other",
  },
  {
    id: 197,
    name: "Greek Super League",
    country: "Greece",
    priority: "other",
  },

  // 🌍 Major international competitions
  {
    id: 1,
    name: "FIFA World Cup",
    country: "World",
    priority: "international",
  },
  {
    id: 4,
    name: "UEFA European Championship",
    country: "Europe",
    priority: "international",
  },
  {
    id: 6,
    name: "Africa Cup of Nations",
    country: "Africa",
    priority: "high",
  },

  // 🌍 CAF club competitions
  {
    id: 12,
    name: "CAF Champions League",
    country: "Africa",
    priority: "high",
  },
  {
    id: 13,
    name: "CAF Confederation Cup",
    country: "Africa",
    priority: "high",
  },
];

export const COMPETITION_IDS = new Set(
  COMPETITIONS.map(
    (competition) => competition.id
  )
);
