// Static 8-month curriculum definition. IDs are stable strings used as keys
// in the persisted progress store.

export type LectureDef = { id: string; title: string; minutes: number };
export type ModuleDef = { id: string; title: string; lectures: LectureDef[] };
export type CourseDef = { id: string; title: string; modules: ModuleDef[] };
export type ProjectDef = {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedHours: number;
  skills: string[];
  requirements: string[];
};
export type QuestionDef = {
  id: string;
  category: string;
  type: "mcq" | "open";
  question: string;
  options?: string[];
  answerIndex?: number;
};
export type AssessmentDef = { id: string; title: string; questions: QuestionDef[] };
export type MonthDef = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  courses: CourseDef[];
  assessment?: AssessmentDef;
  project?: ProjectDef;
};

const mkLectures = (prefix: string, items: [string, number][]): LectureDef[] =>
  items.map(([title, minutes], i) => ({ id: `${prefix}-l${i + 1}`, title, minutes }));

const mkModule = (prefix: string, title: string, items: [string, number][]): ModuleDef => ({
  id: prefix,
  title,
  lectures: mkLectures(prefix, items),
});

// ---------- ASSESSMENTS ----------
const jsQuestions: QuestionDef[] = [
  { id: "q1", category: "Closures", type: "mcq", question: "What is a closure in JavaScript?", options: ["A function bundled with its lexical scope", "A way to close a browser tab", "A loop construct", "A type of object"], answerIndex: 0 },
  { id: "q2", category: "Hoisting", type: "mcq", question: "Which of these are hoisted?", options: ["let and const", "var and function declarations", "class declarations", "import statements"], answerIndex: 1 },
  { id: "q3", category: "Scope", type: "mcq", question: "What scope does `let` use?", options: ["Function", "Global only", "Block", "Module"], answerIndex: 2 },
  { id: "q4", category: "Promises", type: "mcq", question: "What does Promise.all reject with?", options: ["All errors", "The first error", "Undefined", "An array of errors"], answerIndex: 1 },
  { id: "q5", category: "Async/Await", type: "mcq", question: "`await` can be used at top level in...", options: ["CommonJS", "Any file", "ES Modules", "Never"], answerIndex: 2 },
  { id: "q6", category: "Objects", type: "mcq", question: "Object.freeze does what?", options: ["Deep freezes", "Shallow freezes", "Locks types", "Nothing"], answerIndex: 1 },
  { id: "q7", category: "Arrays", type: "mcq", question: "Which mutates the array?", options: ["map", "filter", "splice", "slice"], answerIndex: 2 },
  { id: "q8", category: "Functions", type: "mcq", question: "Arrow functions...", options: ["Have their own `this`", "Bind `this` lexically", "Cannot be async", "Cannot return"], answerIndex: 1 },
  { id: "q9", category: "DOM", type: "mcq", question: "querySelectorAll returns?", options: ["HTMLCollection", "NodeList", "Array", "Element"], answerIndex: 1 },
  { id: "q10", category: "Events", type: "mcq", question: "Event bubbling means...", options: ["Events go child→parent", "Events go parent→child", "Events disappear", "Events repeat"], answerIndex: 0 },
  { id: "q11", category: "ES6", type: "mcq", question: "Spread operator is...", options: ["..", "...", "**", "&&"], answerIndex: 1 },
  { id: "q12", category: "Modules", type: "mcq", question: "Default export per module?", options: ["0", "1", "Many", "Unlimited"], answerIndex: 1 },
  { id: "q13", category: "Closures", type: "mcq", question: "Closures are commonly used for...", options: ["Loops", "Data privacy", "Imports", "Casts"], answerIndex: 1 },
  { id: "q14", category: "Async/Await", type: "mcq", question: "An async function returns?", options: ["Value", "Promise", "Generator", "Iterator"], answerIndex: 1 },
  { id: "q15", category: "Arrays", type: "mcq", question: "reduce signature is?", options: ["(acc, val) => acc", "(val) => val", "(val, acc) => val", "no args"], answerIndex: 0 },
  { id: "q16", category: "Open", type: "open", question: "Explain the event loop in your own words." },
  { id: "q17", category: "Open", type: "open", question: "When would you prefer a Map over a plain object?" },
  { id: "q18", category: "Open", type: "open", question: "Describe debouncing vs throttling." },
  { id: "q19", category: "Open", type: "open", question: "How does prototypal inheritance work?" },
  { id: "q20", category: "Open", type: "open", question: "What pitfalls come with `this` in callbacks?" },
];

// Replicate to ~40 by mirroring categories for breadth
const buildAssessment = (base: QuestionDef[], topic: string): AssessmentDef => {
  const more: QuestionDef[] = base.slice(0, 20).map((q, i) => ({
    ...q,
    id: `${q.id}-b`,
    question: `(${topic}) ${q.question}`,
  }));
  return {
    id: `assess-${topic.toLowerCase()}`,
    title: `${topic} Interview Assessment`,
    questions: [...base, ...more],
  };
};

// ---------- MONTHS ----------
export const MONTHS: MonthDef[] = [
  {
    id: 1,
    title: "JavaScript Mastery",
    subtitle: "From Zero to Expert",
    description: "Build deep fluency in modern JavaScript: language fundamentals, async, DOM, OOP, and modules.",
    courses: [
      {
        id: "js-course",
        title: "The Complete JavaScript Course 2025: From Zero to Expert!",
        modules: [
          mkModule("js-fund", "Language Fundamentals", [["Values, variables & types", 22], ["Operators & coercion", 28], ["Control flow", 25], ["Functions deep dive", 35], ["Strict mode", 12]]),
          mkModule("js-arrays", "Arrays & Objects", [["Array methods", 40], ["Iteration patterns", 30], ["Object literals", 25], ["Destructuring", 22], ["Spread & rest", 18]]),
          mkModule("js-dom", "The DOM & Events", [["Selecting elements", 20], ["Manipulating DOM", 28], ["Event delegation", 24], ["Forms", 26]]),
          mkModule("js-async", "Asynchronous JS", [["Callbacks", 22], ["Promises", 35], ["Async/Await", 32], ["Fetch API", 28], ["Error handling", 20]]),
          mkModule("js-oop", "OOP & Modules", [["Prototypes", 30], ["Classes", 28], ["ES Modules", 22], ["Build tools", 18]]),
        ],
      },
    ],
    assessment: buildAssessment(jsQuestions, "JavaScript"),
    project: {
      id: "p1",
      title: "Bankist — Banking UI",
      description: "Build a beautiful banking interface app with transfers, loans, and timers in vanilla JS.",
      difficulty: "Medium",
      estimatedHours: 24,
      skills: ["DOM", "Async", "OOP", "Arrays"],
      requirements: ["Login flow", "Transfer money", "Request loan", "Account summary", "Auto-logout timer", "Sort transactions"],
    },
  },
  {
    id: 2,
    title: "React Ecosystem",
    subtitle: "React, Next.js & Redux",
    description: "Master component-driven UIs, routing, server rendering, and predictable state management.",
    courses: [
      { id: "react", title: "React", modules: [
        mkModule("r-fund", "React Fundamentals", [["JSX", 18], ["Components", 22], ["Props", 18], ["State & hooks", 30], ["Effects", 26]]),
        mkModule("r-adv", "Advanced Patterns", [["Context", 22], ["Custom hooks", 28], ["Memoization", 24], ["Suspense", 20]]),
      ]},
      { id: "next", title: "Next.js", modules: [
        mkModule("n-fund", "App Router", [["Routing", 22], ["Server components", 30], ["Data fetching", 28], ["Server actions", 25]]),
        mkModule("n-prod", "Production", [["Caching", 22], ["Deployment", 18], ["Middleware", 22]]),
      ]},
      { id: "redux", title: "Redux Toolkit", modules: [
        mkModule("rd-fund", "Redux", [["Slices", 20], ["Async thunks", 24], ["RTK Query", 28], ["Selectors", 18]]),
      ]},
    ],
    assessment: buildAssessment(jsQuestions, "React"),
    project: { id: "p2", title: "Workout Planner", description: "Full-stack React + Next.js workout tracker.", difficulty: "Medium", estimatedHours: 30, skills: ["React", "Next.js", "Redux"], requirements: ["Auth-less local store", "Routine builder", "Daily log", "Charts"] },
  },
  {
    id: 3,
    title: "TypeScript",
    subtitle: "Type-safe at scale",
    description: "Use TypeScript fluently across React apps, libraries, and complex domain models.",
    courses: [
      { id: "ts", title: "TypeScript Deep Dive", modules: [
        mkModule("ts-base", "Foundations", [["Primitives & types", 22], ["Interfaces", 22], ["Generics", 30], ["Narrowing", 24]]),
        mkModule("ts-adv", "Advanced", [["Conditional types", 28], ["Mapped types", 26], ["Utility types", 22], ["TS + React", 30]]),
      ]},
    ],
    assessment: buildAssessment(jsQuestions, "TypeScript"),
    project: { id: "p3", title: "Type-safe API SDK", description: "Build a fully typed SDK with generics, narrowing, and Zod.", difficulty: "Medium", estimatedHours: 22, skills: ["TypeScript", "Zod"], requirements: ["Branded types", "Inferred client", "Error model", "Tests"] },
  },
  {
    id: 4,
    title: "Backend Engineering",
    subtitle: "Node, Express, Postgres, Prisma",
    description: "Design APIs, model relational data, and ship reliable backend services.",
    courses: [
      { id: "node", title: "Node.js + Express", modules: [
        mkModule("node-base", "Node Core", [["Modules", 18], ["Streams", 22], ["File system", 18]]),
        mkModule("exp", "Express", [["Routing", 18], ["Middleware", 22], ["Validation", 18], ["REST design", 24]]),
      ]},
      { id: "pg", title: "PostgreSQL + Prisma", modules: [
        mkModule("pg-base", "Postgres", [["SQL basics", 24], ["Joins & indexes", 28], ["Transactions", 20]]),
        mkModule("prisma", "Prisma", [["Schema", 18], ["Migrations", 18], ["Queries", 22]]),
      ]},
    ],
    assessment: buildAssessment(jsQuestions, "Backend"),
    project: { id: "p4", title: "Realtime Issue Tracker API", description: "Express + Prisma + Postgres API with auth-less seed data.", difficulty: "Hard", estimatedHours: 32, skills: ["Node", "Express", "Postgres", "Prisma"], requirements: ["CRUD", "Pagination", "Search", "Migrations"] },
  },
  {
    id: 5,
    title: "Auth, Testing & Hardening",
    subtitle: "Production-grade backends",
    description: "Secure systems, comprehensive testing, and resilient backend patterns.",
    courses: [
      { id: "auth", title: "Authentication", modules: [
        mkModule("a-base", "Auth Concepts", [["Sessions vs JWT", 22], ["OAuth", 24], ["Password hashing", 18]]),
      ]},
      { id: "test", title: "Testing", modules: [
        mkModule("t-base", "Testing Pyramid", [["Unit testing", 24], ["Integration", 22], ["E2E with Playwright", 28]]),
      ]},
      { id: "hard", title: "Hardening", modules: [
        mkModule("h-base", "Production Ready", [["Rate limiting", 18], ["CSRF / CORS", 18], ["Observability", 22]]),
      ]},
    ],
    assessment: buildAssessment(jsQuestions, "Security"),
    project: { id: "p5", title: "Hardened SaaS Starter", description: "Auth-protected SaaS template with tests and observability.", difficulty: "Hard", estimatedHours: 36, skills: ["Auth", "Testing", "Security"], requirements: ["Auth flows", "Rate limit", "Tests >80% coverage"] },
  },
  {
    id: 6,
    title: "System Design & DevOps",
    subtitle: "Scale & ship reliably",
    description: "Design distributed systems and operate them with modern DevOps tooling.",
    courses: [
      { id: "sd", title: "System Design", modules: [
        mkModule("sd-base", "Foundations", [["Scalability", 28], ["Caching", 22], ["Queues", 22], ["Sharding", 26]]),
      ]},
      { id: "do", title: "DevOps", modules: [
        mkModule("do-base", "CI/CD & Infra", [["Docker", 24], ["GitHub Actions", 20], ["Cloudflare/Vercel", 22], ["Monitoring", 22]]),
      ]},
    ],
    assessment: buildAssessment(jsQuestions, "System Design"),
    project: { id: "p6", title: "Designed-for-Scale URL Shortener", description: "Build with caching, queue, and observability.", difficulty: "Hard", estimatedHours: 30, skills: ["System Design", "DevOps"], requirements: ["100k req/s plan", "Cache layer", "Metrics dashboard"] },
  },
  {
    id: 7,
    title: "Flagship Project",
    subtitle: "Capstone build",
    description: "Ship a portfolio-grade product. Weekly milestones, no assessment.",
    courses: [
      { id: "flag", title: "Flagship Build", modules: [
        mkModule("w1", "Week 1 — Scope & Design", [["Define product", 60], ["Wireframes", 90], ["Tech plan", 60]]),
        mkModule("w2", "Week 2 — Core", [["Data model", 90], ["Core flows", 120], ["Auth", 60]]),
        mkModule("w3", "Week 3 — Polish", [["Edge cases", 90], ["Performance", 60], ["A11y pass", 60]]),
        mkModule("w4", "Week 4 — Launch", [["Tests", 90], ["Deploy", 60], ["Marketing page", 90]]),
      ]},
    ],
    project: { id: "p7", title: "Final Project Review", description: "Self-review, write a launch post, record a demo.", difficulty: "Hard", estimatedHours: 12, skills: ["Everything"], requirements: ["Demo video", "Launch post", "Retrospective"] },
  },
  {
    id: 8,
    title: "Interview Prep & Job Search",
    subtitle: "Land the role",
    description: "Resume, portfolio, applications, interviews, offers.",
    courses: [
      { id: "prep", title: "Interview Prep", modules: [
        mkModule("res", "Resume & Portfolio", [["Resume polish", 60], ["Portfolio polish", 90], ["LinkedIn", 45]]),
        mkModule("apps", "Applications", [["Wishlist 30 companies", 60], ["Daily applications", 120], ["Recruiter outreach", 60]]),
        mkModule("mock", "Mock Interviews", [["Behavioral", 60], ["System design", 90], ["Coding rounds", 120]]),
        mkModule("off", "Offers", [["Negotiation", 45], ["Decision", 30]]),
      ]},
    ],
  },
];

export const ALL_LECTURE_IDS = MONTHS.flatMap((m) =>
  m.courses.flatMap((c) => c.modules.flatMap((mod) => mod.lectures.map((l) => l.id)))
);
export const TOTAL_LECTURES = ALL_LECTURE_IDS.length;
export const TOTAL_MINUTES = MONTHS.reduce(
  (acc, m) =>
    acc +
    m.courses.reduce(
      (a, c) => a + c.modules.reduce((b, mod) => b + mod.lectures.reduce((s, l) => s + l.minutes, 0), 0),
      0
    ),
  0
);
