/**
 * MIC TECH seed — categories, settings, the single administrator and demo editorial
 * content. Safe to run repeatedly. Use --reset to rebuild local demo data.
 *
 * Demo articles are editorial sample content, not fabricated analytics. Production
 * seeding requires ADMIN_EMAIL + ADMIN_PASSWORD and never creates demo readers.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../lib/auth/password.js";
import { readingTime } from "../lib/utils.js";

async function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = await fs.readFile(path.join(process.cwd(), file), "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (!match) continue;
        const [, key, rawValue] = match;
        if (process.env[key] !== undefined) continue;
        process.env[key] = rawValue.replace(/^["']|["']$/g, "");
      }
    } catch {
      /* optional */
    }
  }
}

await loadEnv();

const reset = process.argv.includes("--reset");
const production = process.env.NODE_ENV === "production";

if (reset && production && !process.argv.includes("--allow-production-reset")) {
  console.error("Refusing to reset a production database. Pass --allow-production-reset explicitly.");
  process.exit(1);
}

const { db, ensureDb, DB_DRIVER } = await import("../lib/db/store.js");

await ensureDb();

const COLLECTIONS = [
  "users",
  "articles",
  "categories",
  "media",
  "comments",
  "likes",
  "bookmarks",
  "notifications",
  "analyticsEvents",
  "auditLogs",
  "newsletterSubscribers",
  "reports",
  "settings",
];

if (reset) {
  for (const name of COLLECTIONS) await db.collection(name).deleteMany({});
  console.log("Reset: cleared all collections.");
}

const now = new Date();
const iso = (date) => date.toISOString();
const daysAgo = (days) => iso(new Date(now.getTime() - days * 86400000));
const hoursAgo = (hours) => iso(new Date(now.getTime() - hours * 3600000));

const CATEGORIES = [
  ["Pakistan", "pakistan", "Politics, policy and power across the country.", 1],
  ["World", "world", "Global affairs, diplomacy and conflict.", 2],
  ["Technology", "technology", "AI, startups, devices and the digital economy.", 3],
  ["Business", "business", "Markets, industry and the economy.", 4],
  ["Science", "science", "Research, space and discovery.", 5],
  ["Education", "education", "Schools, universities and learning.", 6],
  ["Sports", "sports", "Cricket, football and the stories behind the score.", 7],
  ["Entertainment", "entertainment", "Film, music, culture and celebrity.", 8],
  ["Health", "health", "Medicine, wellbeing and public health.", 9],
  ["Politics", "politics", "Elections, governance and accountability.", 10],
];

const categoryMap = {};
for (const [name, slug, description, order] of CATEGORIES) {
  const existing = await db.collection("categories").findOne({ slug });
  if (existing) {
    categoryMap[slug] = existing;
    continue;
  }
  const category = {
    _id: randomUUID(),
    name,
    slug,
    description,
    order,
    hidden: false,
    createdAt: iso(now),
    updatedAt: iso(now),
  };
  categoryMap[slug] = await db.collection("categories").insertOne(category);
}
console.log(`Categories ready (${Object.keys(categoryMap).length}).`);

const existingSettings = await db.collection("settings").findOne({ _id: "site" });
if (!existingSettings) {
  await db.collection("settings").insertOne({
    _id: "site",
    siteName: "MIC TECH",
    tagline: "Precision. Perspective. Pakistan.",
    description:
      "Independent reporting and analysis on Pakistan, world affairs, technology, business and culture.",
    contactEmail: "editor@mictech.news",
    address: "Karachi, Pakistan",
    social: {
      x: "https://x.com/mictechnews",
      facebook: "https://www.facebook.com/mictechnews",
      instagram: "",
      youtube: "https://www.youtube.com/@mictechnews",
      linkedin: "",
    },
    newsletterEnabled: true,
    commentsEnabled: true,
    commentsAutoApprove: false,
    breakingTickerEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: "MIC TECH is performing scheduled maintenance. We will be back shortly.",
    defaultSeoTitle: "MIC TECH — News with precision and perspective",
    defaultSeoDescription:
      "Independent reporting and analysis on Pakistan, world affairs, technology, business and culture.",
    analyticsRetentionDays: 730,
    createdAt: iso(now),
    updatedAt: iso(now),
  });
}
console.log("Settings ready.");

let admin = await db.collection("users").findOne({ role: "admin" });
let generatedAdminPassword = "";
if (!admin) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@mictech.news";
  let adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminPassword) {
    if (production) {
      console.error("ADMIN_PASSWORD is required to seed production. Aborting.");
      process.exit(1);
    }
    generatedAdminPassword = "MicTech@2026!";
    adminPassword = generatedAdminPassword;
  }
  if (adminPassword.length < 10 || !/[A-Za-z]/.test(adminPassword) || !/[0-9]/.test(adminPassword)) {
    console.error("ADMIN_PASSWORD must be at least 10 characters and include a letter and a number.");
    process.exit(1);
  }
  admin = await db.collection("users").insertOne({
    _id: randomUUID(),
    name: process.env.ADMIN_NAME || "MIC TECH Editor",
    email: adminEmail.toLowerCase(),
    username: "editor",
    passwordHash: await hashPassword(adminPassword),
    role: "admin",
    emailVerified: true,
    disabled: false,
    deletedAt: null,
    failedLogins: 0,
    lockedUntil: null,
    sessionVersion: 0,
    bio: "Editor of MIC TECH.",
    avatarUrl: "",
    notificationPrefs: { comments: true, replies: true, newsletter: false, product: false },
    mfaEnabled: false,
    mfaSecret: "",
    lastLoginAt: null,
    createdAt: iso(now),
    updatedAt: iso(now),
  });
  console.log(`Administrator created: ${admin.email}`);
} else {
  console.log(`Administrator already exists: ${admin.email}`);
}

let reader = null;
if (!production) {
  reader = await db.collection("users").findOne({ email: "reader@mictech.news" });
  if (!reader) {
    reader = await db.collection("users").insertOne({
      _id: randomUUID(),
      name: "Ayesha Khan",
      email: "reader@mictech.news",
      username: "ayesha",
      passwordHash: await hashPassword("Reader@2026!"),
      role: "user",
      emailVerified: true,
      disabled: false,
      deletedAt: null,
      failedLogins: 0,
      lockedUntil: null,
      sessionVersion: 0,
      bio: "Reader, occasional commenter, Karachi.",
      avatarUrl: "",
      notificationPrefs: { comments: true, replies: true, newsletter: true, product: false },
      mfaEnabled: false,
      mfaSecret: "",
      lastLoginAt: null,
      createdAt: iso(now),
      updatedAt: iso(now),
    });
    console.log("Demo reader created: reader@mictech.news");
  }
}

const blockId = () => randomUUID();
const p = (text) => ({ id: blockId(), type: "text", text });
const quote = (text, attribution) => ({ id: blockId(), type: "quote", text, attribution });
const highlight = (title, text) => ({ id: blockId(), type: "highlight", title, text });
const image = (file, alt, caption, credit = "MIC TECH illustration") => ({
  id: blockId(),
  type: "image",
  url: `/images/editorial/${file}`,
  alt,
  caption,
  credit,
});

const ARTICLES = [
  {
    slug: "inside-pakistans-first-ai-research-cluster",
    title: "Inside the race to build Pakistan's first AI research cluster",
    subtitle:
      "Universities, startups and a new generation of engineers are trying to turn scattered talent into a research ecosystem.",
    excerpt:
      "A cluster of labs in Lahore, Karachi and Islamabad is betting that applied research, not another app, is the next chapter of Pakistan's technology story.",
    category: "technology",
    tags: ["artificial-intelligence", "research", "startups"],
    image: "02.svg",
    featured: true,
    hours: 3,
    blocks: [
      p("On the second floor of a converted office in Lahore, a team of eleven researchers is training a language model on Urdu legal documents. The room is unremarkable: whiteboards, tangled cables, a single air conditioner fighting the afternoon heat. The ambition is not."),
      p("The project is one of several attempting to build a research cluster around artificial intelligence in Pakistan, connecting university labs with startups that have spent the last decade shipping consumer apps. The shift matters because applied research creates durable capability: datasets, evaluation methods, trained engineers and the institutional memory that survives a single product cycle."),
      quote(
        "We do not need another food delivery app. We need problems that force us to build things we cannot buy off the shelf.",
        "Dr. Sana Iqbal, computer science researcher",
      ),
      p("The obstacles are familiar. Compute is expensive and often imported. Visa regimes make conferences harder. Funding cycles reward short demonstrations over long experiments. Yet the past two years have produced a quiet change in how founders talk about their work: less emphasis on valuation, more on reproducibility."),
      highlight(
        "Why it matters",
        "A functioning research cluster would let Pakistani firms own the models and data pipelines they depend on, rather than renting capability from abroad.",
      ),
      p("The next test is whether the cluster can produce peer-reviewed work and retain the people who create it. Both are harder than a launch event. For now, the researchers are betting that patience is a competitive advantage."),
    ],
  },
  {
    slug: "pakistans-digital-economy-rules-are-catching-up",
    title: "Pakistan's digital economy is growing up. Its rules are not.",
    subtitle:
      "Payments, freelancing and online retail are scaling faster than the frameworks meant to govern them.",
    excerpt:
      "The country's digital economy is no longer a niche. The next phase will be decided by boring, difficult questions about tax, data and dispute resolution.",
    category: "business",
    tags: ["digital-economy", "regulation", "payments"],
    image: "01.svg",
    featured: true,
    hours: 7,
    blocks: [
      p("Pakistan's digital economy has spent a decade being described as an opportunity. It is now large enough to be described as a problem, at least for regulators. Freelancers earn in foreign currency, small retailers sell through social platforms, and payment rails have multiplied faster than the rules that govern them."),
      p("That is a healthy problem, but it is still a problem. Businesses report uncertainty about tax treatment, inconsistent enforcement and a compliance burden calibrated for large firms. Consumers, meanwhile, have little recourse when a digital purchase goes wrong."),
      highlight(
        "The next phase",
        "Growth will depend less on new apps and more on predictable rules: clear data rights, fast dispute resolution and payment systems that work across borders.",
      ),
      quote(
        "The informal economy did not disappear online. It simply moved into a new interface.",
        "A payments executive in Karachi",
      ),
      p("The good news is that the policy conversation has become more concrete. Industry groups are publishing proposals with numbers attached. Regulators are experimenting with sandboxes. The gap between rhetoric and implementation remains wide, but the direction is clearer than it was five years ago."),
    ],
  },
  {
    slug: "the-budget-arithmetic-behind-the-headlines",
    title: "The budget arithmetic behind the headlines",
    subtitle:
      "Beyond the speeches and the slogans, a handful of numbers will decide what the next fiscal year actually feels like.",
    excerpt:
      "A guide to the revenue, debt and spending assumptions that shape the budget, and what happens if they do not hold.",
    category: "politics",
    tags: ["budget", "economy", "governance"],
    image: "03.svg",
    featured: true,
    breaking: true,
    hours: 1,
    blocks: [
      p("Budgets are political documents, but they are also forecasts. The political argument dominates the evening news; the forecast determines whether the arithmetic survives contact with the year. In Pakistan, the gap between the two has been the source of repeated crises."),
      p("Three assumptions matter most: the growth rate, the tax collection target and the cost of borrowing. Each is connected. Miss the revenue target and the government borrows more. Borrow more and debt service crowds out investment. Slow investment and the growth assumption becomes unreachable."),
      quote(
        "A budget is not a plan. It is a set of bets about behaviour.",
        "A former finance ministry official",
      ),
      highlight(
        "Watch these numbers",
        "Tax revenue as a share of GDP, the primary balance, and the share of spending consumed by debt service. Together they describe the room for everything else.",
      ),
      p("The budget's credibility will be tested in the first quarter, when provisional revenue figures arrive. Until then, the speeches are the easy part."),
    ],
  },
  {
    slug: "a-city-learns-to-live-with-50c",
    title: "A city learns to live with 50°C",
    subtitle:
      "Heat is no longer an emergency. In parts of Sindh it is a season, and the city is being rebuilt around it.",
    excerpt:
      "From shaded streets to cooling centres, Karachi is testing whether adaptation can happen faster than the temperature rises.",
    category: "pakistan",
    tags: ["climate", "heatwave", "karachi"],
    image: "11.svg",
    featured: true,
    hours: 14,
    blocks: [
      p("The first sign is not the thermometer. It is the street emptying at eleven in the morning. Shopkeepers pull down shutters, delivery riders change their routes, and the city's informal economy reorganises around shade."),
      p("Karachi has always been hot. What has changed is the frequency and duration of extreme heat, and the recognition that public infrastructure was not designed for it. A pilot programme of cooling centres, reflective roofs and tree-lined corridors is now moving from proposal to pavement in several districts."),
      image("04.svg", "Layered gold lines suggesting heat rising over a dark horizon", "Heat adaptation is reshaping public space in Karachi.", "MIC TECH illustration"),
      highlight(
        "Adaptation is infrastructure",
        "Shade, water, electricity and public transport are heat measures. The cities that treat them as such will be more liveable and more equal.",
      ),
      quote(
        "You cannot tell people to stay indoors if their homes are hotter than the street.",
        "A community health worker in Lyari",
      ),
      p("The limits are financial and political. Cooling centres need staff, water and reliable power. Trees need years. But the alternative is a city that shuts down for weeks at a time, and that cost is already being counted."),
    ],
  },
  {
    slug: "red-sea-detour-global-prices",
    title: "The Red Sea detour is quietly rewriting global prices",
    subtitle:
      "Longer routes, higher insurance and nervous shippers are adding a hidden tax to everyday goods.",
    excerpt:
      "The shipping crisis is no longer a headline about one route. It is a slow-moving cost that is working its way through supply chains.",
    category: "world",
    tags: ["trade", "shipping", "economy"],
    image: "05.svg",
    hours: 10,
    blocks: [
      p("A container ship that avoids the Red Sea adds roughly ten days to a journey between Asia and Europe. Ten days is not dramatic in a photograph. In a supply chain, it is inventory, working capital and a missed season."),
      p("Freight rates have responded, but the more important change is in behaviour. Retailers are ordering earlier, holding more stock and diversifying suppliers. Insurance premiums have risen for routes that were once routine. The result is a cost that appears in different places depending on the product: a higher landed price, a smaller margin, or a delay."),
      quote(
        "The map looks temporary. The planning assumptions are not.",
        "A logistics analyst in Dubai",
      ),
      highlight(
        "The second-order effect",
        "Shipping disruptions rarely stay in shipping. They surface as inflation in categories far removed from the original route.",
      ),
      p("For exporters in Pakistan, the immediate question is competitiveness. Longer routes and higher insurance erode the advantage of lower labour costs. The strategic answer is not a single new corridor but a more resilient mix of markets and logistics partners."),
    ],
  },
  {
    slug: "five-years-of-monsoon-data",
    title: "What five years of monsoon data tells us about the next decade",
    subtitle:
      "The pattern is not simply more rain. It is rain arriving differently, in places and at speeds the old models did not expect.",
    excerpt:
      "Researchers are rebuilding flood forecasts around a simple finding: the same annual total can produce very different outcomes.",
    category: "science",
    tags: ["climate", "monsoon", "research"],
    image: "04.svg",
    hours: 20,
    blocks: [
      p("For years, the monsoon conversation focused on totals. How much rain fell, and how it compared with the average. A new body of research argues that the total is the least interesting number."),
      p("What matters more is intensity and timing: how much rain falls in a single hour, whether the ground has time to absorb it, and whether the same volume arrives at the start or the end of the season. Two years with identical totals can produce a manageable season and a catastrophic one."),
      highlight(
        "Forecasting gap",
        "Existing models are better at predicting seasonal totals than the short, intense bursts that cause urban flooding and flash damage.",
      ),
      quote(
        "We are not short of data. We are short of the systems that turn data into decisions.",
        "A hydrologist at a public university",
      ),
      p("The practical implication is unglamorous: better gauges, faster data sharing and local warning systems. The science is improving. The last mile is still the bottleneck."),
    ],
  },
  {
    slug: "pakistans-womens-cricket-record-book",
    title: "A new generation is rewriting Pakistan's cricket record book",
    subtitle:
      "More matches, better contracts and a deeper bench are changing what the national team can imagine.",
    excerpt:
      "The transformation is not only in results. It is in the number of players who believe they have a future in the game.",
    category: "sports",
    tags: ["cricket", "women-in-sport", "pakistan"],
    image: "10.svg",
    hours: 26,
    blocks: [
      p("The scorecard tells one story. The training ground tells another. At a facility on the edge of Lahore, a group of teenagers is working through a fielding drill while the senior squad trains on the adjacent pitch. Five years ago, there was no adjacent pitch."),
      p("Domestic structures remain imperfect, but the direction is clear. More matches mean more exposure. Better contracts mean fewer players leaving the game in their early twenties. A deeper bench means selection is no longer a choice between experience and availability."),
      quote(
        "The biggest change is that young players can now see a pathway. That changes everything.",
        "A national team coach",
      ),
      highlight(
        "What to watch",
        "Depth, not just results. The next leap depends on sustaining a domestic competition with enough quality to develop players who can replace the senior core.",
      ),
      p("There is a long way to go, particularly in pay parity and media coverage. But the record book is no longer the only measure of progress. The pipeline is."),
    ],
  },
  {
    slug: "the-curriculum-debate-pakistan-keeps-postponing",
    title: "The curriculum debate Pakistan keeps postponing",
    subtitle:
      "Every reform cycle begins with textbooks and ends with implementation. The gap is where the next cycle begins.",
    excerpt:
      "A familiar argument about what schools should teach, and a less familiar question about who is responsible for making it work.",
    category: "education",
    tags: ["education", "curriculum", "policy"],
    image: "08.svg",
    hours: 32,
    blocks: [
      p("Curriculum reform in Pakistan has a predictable choreography. A committee is formed, a document is published, textbooks are rewritten, and then the harder questions arrive: teacher training, assessment, language policy and the capacity of schools to deliver what the document promises."),
      p("The result is a cycle in which the most visible part of reform, the text, changes more often than the part that determines outcomes: what happens in the classroom."),
      highlight(
        "The implementation gap",
        "A curriculum is only as good as the teachers trained to teach it and the assessments used to measure it.",
      ),
      quote(
        "We keep rewriting the map and wondering why the roads are still broken.",
        "A school principal in Multan",
      ),
      p("There are examples of progress, particularly in provinces that have invested in teacher development alongside materials. But the scale of the gap means that the next reform will be judged by the same test: not by the quality of the document, but by the quality of the classroom."),
    ],
  },
  {
    slug: "why-sleep-clinics-are-appearing-across-karachi",
    title: "Why sleep clinics are appearing across Karachi",
    subtitle:
      "A condition once dismissed as a lifestyle problem is being recognised as a public health issue.",
    excerpt:
      "Sleep disorders are common, underdiagnosed and increasingly treatable. The constraint is no longer awareness alone, but access.",
    category: "health",
    tags: ["health", "sleep", "public-health"],
    image: "09.svg",
    hours: 40,
    blocks: [
      p("For years, snoring was a joke and insomnia was a private inconvenience. That is changing. A small but growing number of clinics in Karachi are offering sleep studies, and referrals are rising from cardiologists, neurologists and general practitioners."),
      p("The reasons are partly clinical and partly cultural. Research has strengthened the link between untreated sleep apnoea and cardiovascular disease. At the same time, a younger generation of doctors is more comfortable asking about sleep as part of a routine history."),
      quote(
        "Patients often come for fatigue. The diagnosis is something they have lived with for a decade.",
        "A pulmonologist in Karachi",
      ),
      highlight(
        "Access gap",
        "Sleep studies remain expensive and concentrated in private facilities. Public-sector capacity is limited, and awareness in smaller cities is lower.",
      ),
      p("The next step is not simply more clinics. It is training primary care doctors to screen for common disorders and to distinguish cases that need specialist investigation from those that can be managed with straightforward changes."),
    ],
  },
  {
    slug: "the-quiet-return-of-urdu-literary-salons",
    title: "The quiet return of Urdu's literary salons",
    subtitle:
      "In living rooms and small cafes, a tradition is being rebuilt by people who found each other online.",
    excerpt:
      "A new generation of readers is organising around poetry, criticism and the pleasure of listening together.",
    category: "entertainment",
    tags: ["culture", "literature"],
    image: "07.svg",
    hours: 46,
    blocks: [
      p("The invitation arrives as a message with a location pin. Twenty people, a rug, a microphone that may or may not work. The format is old: a host, a reader, an audience willing to sit with a poem for longer than a social media post."),
      p("What is new is how these gatherings are organised. Group chats and online reading circles bring together people who would not otherwise meet. The events are small, often free, and deliberately unglamorous."),
      quote(
        "We are not reviving a tradition. We are discovering it for ourselves.",
        "The organiser of a Karachi reading circle",
      ),
      highlight(
        "Why it matters",
        "Literary salons create a rare thing: sustained attention. In a media environment built for speed, that is a form of resistance.",
      ),
      p("The movement is too small to reverse the economics of publishing. But it is changing how a certain generation relates to Urdu: not as a subject to be examined, but as a living language with an audience."),
    ],
  },
  {
    slug: "founders-betting-on-offline-first-software",
    title: "The founders betting on offline-first software",
    subtitle:
      "In markets where connectivity is uneven, the most interesting products are designed to work when the network does not.",
    excerpt:
      "A quiet architectural choice is producing better software for schools, clinics and small businesses.",
    category: "technology",
    tags: ["startups", "software", "connectivity"],
    image: "12.svg",
    hours: 54,
    blocks: [
      p("The demo is deliberately unglamorous. A tablet is placed on a table, the Wi-Fi is switched off, and a school administrator marks attendance, records a fee payment and generates a receipt. When the connection returns, the data syncs without a duplicate."),
      p("Offline-first design is not new. But it is becoming a strategic advantage in markets where connectivity is uneven and data costs matter. Founders who build for the constraint end up with products that are faster, more resilient and easier to trust."),
      highlight(
        "The trade-off",
        "Offline-first systems are harder to build. Conflict resolution, sync and data integrity require discipline that a simple cloud app can ignore.",
      ),
      quote(
        "Our users do not care about our architecture. They care that the screen works during load-shedding.",
        "A founder building school software",
      ),
      p("The next challenge is scale. The same architecture that works for a single school must hold for a district, then a province. The founders argue that the hard work now saves a much harder migration later."),
    ],
  },
  {
    slug: "inside-the-slow-reform-of-pakistans-power-grid",
    title: "Inside the slow reform of Pakistan's power grid",
    subtitle: "Capacity was the easy problem. The grid, the tariffs and the institutions are the hard ones.",
    excerpt: "A draft analysis of the next phase of electricity reform.",
    category: "business",
    tags: ["energy", "power", "reform"],
    image: "06.svg",
    status: "draft",
    blocks: [
      p("Pakistan solved one version of its electricity problem: generation capacity. The next version is more difficult because it involves transmission, distribution and the political economy of tariffs."),
      p("This draft is being prepared for publication. It will examine the gap between installed capacity and delivered power, and the institutional reforms required to close it."),
    ],
  },
  {
    slug: "the-week-ahead-five-stories-we-are-watching",
    title: "The week ahead: five stories we are watching",
    subtitle: "A guide to the decisions, data releases and debates that will shape the news.",
    excerpt: "Our editorial desk previews the week.",
    category: "pakistan",
    tags: ["briefing", "week-ahead"],
    image: "06.svg",
    status: "scheduled",
    scheduledHours: 20,
    blocks: [
      p("This week's briefing tracks a budget review, a central bank data release, a key court hearing, the next round of climate talks and a major sporting fixture."),
      p("MIC TECH will publish analysis as each story develops. This preview will be updated with context and links."),
    ],
  },
        ];


let insertedArticles = 0;
const articleMap = {};
for (const item of ARTICLES) {
  const existing = await db.collection("articles").findOne({ slug: item.slug });
  if (existing) {
    articleMap[item.slug] = existing;
    continue;
  }
  const category = categoryMap[item.category];
  const publishedAt = item.publishedAt || hoursAgo(item.hours || 24);
  const status = item.status || "published";
  const scheduledAt =
    status === "scheduled"
      ? new Date(now.getTime() + (item.scheduledHours || 24) * 3600000).toISOString()
      : null;
  const article = {
    _id: randomUUID(),
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle || "",
    excerpt: item.excerpt || "",
    language: item.language || "en",
    categoryId: category._id,
    categorySlug: category.slug,
    categoryName: category.name,
    tags: item.tags || [],
    coverImage: {
      url: `/images/editorial/${item.image}`,
      alt: `MIC TECH editorial illustration for ${item.title}`,
      credit: "MIC TECH illustration",
    },
    blocks: item.blocks,
    status,
    publishedAt: status === "published" ? publishedAt : null,
    scheduledAt,
    featured: Boolean(item.featured),
    breaking: Boolean(item.breaking),
    sponsored: false,
    seo: { title: "", description: item.excerpt || "", canonical: "", socialImage: "", noindex: false },
    readingTime: readingTime(item.blocks),
    authorId: admin._id,
    authorName: admin.name,
    deletedAt: null,
    createdAt: publishedAt,
    updatedAt: publishedAt,
  };
  const created = await db.collection("articles").insertOne(article);
  articleMap[item.slug] = created;
  insertedArticles += 1;
}
console.log(`Articles ready (${insertedArticles} inserted).`);

if (reader && !production) {
  const existingComments = await db.collection("comments").count({});
  if (!existingComments) {
    const targets = [
      ["inside-pakistans-first-ai-research-cluster", "approved", "The point about reproducibility is the one that matters. We have too many demo days and too few long experiments."],
      ["a-city-learns-to-live-with-50c", "approved", "Cooling centres are a start, but the bigger issue is housing. People in low-income areas cannot afford to cool their homes."],
      ["the-budget-arithmetic-behind-the-headlines", "pending", "Would be useful to see the assumptions as a table rather than prose. The debt service share is the number I keep looking for."],
    ];
    for (const [slug, status, body] of targets) {
      const article = articleMap[slug];
      if (!article) continue;
      await db.collection("comments").insertOne({
        _id: randomUUID(),
        articleId: article._id,
        userId: reader._id,
        userName: reader.name,
        userAvatar: "",
        parentId: null,
        body,
        status,
        createdAt: iso(new Date(now.getTime() - 3600000)),
        updatedAt: iso(new Date(now.getTime() - 3600000)),
        moderatedAt: status === "approved" ? iso(now) : null,
        moderatedBy: status === "approved" ? admin._id : "",
      });
    }
    console.log("Demo comments created (1 pending for moderation).");
  }
}

console.log("\n--- MIC TECH seed complete ---");
console.log(`Driver: ${DB_DRIVER === "mongo" ? "MongoDB Atlas" : "Local JSON (.data/db.json)"}`);
console.log(`Admin:  ${admin.email}`);
if (generatedAdminPassword) console.log(`Admin password (development only): ${generatedAdminPassword}`);
else if (production) console.log("Admin password: set by ADMIN_PASSWORD.");
else console.log("Admin password: unchanged (existing account).");
if (reader) console.log("Reader: reader@mictech.news / Reader@2026! (development only)");
if (!production) {
  console.log("\nDemo analytics are NOT seeded. Dashboard numbers come only from real visits.");
}
