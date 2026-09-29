import bcrypt from "bcryptjs";
import type { DatabaseSync } from "node:sqlite";

export const DEMO_PASSWORD = "password123";

type SeedProfile = {
  id: string;
  email: string;
  full_name: string;
  location: string;
  rating: string;
  avatar: string;
  available: number;
  offer_skill: string;
  want_skill: string;
  bio: string;
  member_since: string;
  completed_swaps: number;
  skills: string[];
};

const browseProfiles: SeedProfile[] = [
  {
    id: "eric",
    email: "eric@profile.swapspot",
    full_name: "Eric Yates",
    location: "London, UK",
    rating: "4.9 (5)",
    avatar: "https://i.pravatar.cc/96?u=eric",
    available: 1,
    offer_skill: "Graphic Design",
    want_skill: "Web Development",
    bio: "Brand designer with 6 years of experience helping startups build visual identities. I love swapping skills and learning from developers.",
    member_since: "March 2024",
    completed_swaps: 5,
    skills: ["Graphic Design", "Branding", "Illustration"],
  },
  {
    id: "neha",
    email: "neha@profile.swapspot",
    full_name: "Neha Mayumi",
    location: "Tokyo, Japan",
    rating: "4.8 (12)",
    avatar: "https://i.pravatar.cc/96?u=neha",
    available: 1,
    offer_skill: "Photography",
    want_skill: "UI Design",
    bio: "Product photographer focused on lifestyle and e-commerce shoots. Looking to trade photography sessions for UI design mentorship.",
    member_since: "January 2024",
    completed_swaps: 12,
    skills: ["Photography", "Photo Editing", "Lighting"],
  },
  {
    id: "boston",
    email: "boston@profile.swapspot",
    full_name: "Boston Thomas",
    location: "New York, USA",
    rating: "4.7 (8)",
    avatar: "https://i.pravatar.cc/96?u=boston",
    available: 0,
    offer_skill: "Marketing",
    want_skill: "Content Writing",
    bio: "Growth marketer who has scaled two SaaS products from zero to traction. Currently unavailable for new swaps until April.",
    member_since: "November 2023",
    completed_swaps: 8,
    skills: ["Marketing", "SEO", "Content Strategy"],
  },
];

const demoUser = {
  id: "demo-user",
  email: "demo@swapspot.test",
  full_name: "Dwiky Ahmad",
  phone: "",
  location: "",
  bio: "",
  avatar: "https://i.pravatar.cc/80?u=dwiky",
  balance: 157,
  offer_skill: "Web Development",
  want_skill: "Graphic Design",
  onboarding_complete: 1,
  email_verified: 1,
  skillsOffer: ["Web Development"],
  skillsWant: ["Graphic Design"],
};

type UpsertUserInput = {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  location?: string;
  bio?: string;
  avatar?: string;
  balance?: number;
  available?: number;
  rating?: string;
  member_since?: string;
  completed_swaps?: number;
  offer_skill?: string;
  want_skill?: string;
  email_verified?: number;
  onboarding_complete?: number;
};

function upsertUser(
  db: DatabaseSync,
  user: UpsertUserInput,
  passwordHash: string,
  options: { is_browseable?: boolean } = {}
): void {
  db.prepare(
    `INSERT INTO users (
      id, email, password_hash, full_name, phone, location, bio, avatar, balance,
      available, rating, member_since, completed_swaps, offer_skill, want_skill,
      is_browseable, email_verified, onboarding_complete
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      password_hash = excluded.password_hash,
      full_name = excluded.full_name,
      phone = excluded.phone,
      location = excluded.location,
      bio = excluded.bio,
      avatar = excluded.avatar,
      balance = excluded.balance,
      available = excluded.available,
      rating = excluded.rating,
      member_since = excluded.member_since,
      completed_swaps = excluded.completed_swaps,
      offer_skill = excluded.offer_skill,
      want_skill = excluded.want_skill,
      is_browseable = excluded.is_browseable,
      email_verified = excluded.email_verified,
      onboarding_complete = excluded.onboarding_complete`
  ).run(
    user.id,
    user.email,
    passwordHash,
    user.full_name ?? null,
    user.phone || "",
    user.location || "",
    user.bio || "",
    user.avatar || "",
    user.balance ?? 157,
    user.available ?? 1,
    user.rating || "4.5 (0)",
    user.member_since || "March 2026",
    user.completed_swaps ?? 0,
    user.offer_skill || "",
    user.want_skill || "",
    options.is_browseable ? 1 : 0,
    user.email_verified ? 1 : 0,
    user.onboarding_complete ? 1 : 0
  );
}

function replaceSkills(
  db: DatabaseSync,
  userId: string,
  skills: string[],
  wants: string[] = []
): void {
  db.prepare("DELETE FROM user_skills WHERE user_id = ?").run(userId);
  const insert = db.prepare(
    "INSERT INTO user_skills (user_id, skill, kind) VALUES (?, ?, ?)"
  );

  for (const skill of skills) {
    insert.run(userId, skill, "offer");
  }
  for (const skill of wants) {
    insert.run(userId, skill, "want");
  }
}

function seedSwaps(db: DatabaseSync, ownerId: string): void {
  const swaps = [
    {
      id: "ongoing-eric",
      owner_id: ownerId,
      partner_id: "eric",
      type: "ongoing",
      swapping: "Web Development",
      exchange: "Graphic Design",
      offering: null as string | null,
      swapped: null as string | null,
      partner_name: "Eric Yates",
      timer: "08:05:35",
      action: "dispute",
      status: "dispute",
      status_label: "Dispute open",
      started_at: "March 10, 2026",
      deadline: "March 24, 2026",
      received_at: null as string | null,
      completed_at: null as string | null,
      rating: null as string | null,
      description:
        "Eric is building a responsive landing page while you deliver logo files and a brand style guide for his portfolio site.",
      deposit: 50,
    },
    {
      id: "ongoing-boston",
      owner_id: ownerId,
      partner_id: "boston",
      type: "ongoing",
      swapping: "Graphic Design",
      exchange: "Web Development",
      offering: null,
      swapped: null,
      partner_name: "Boston Thomas",
      timer: "12:42:18",
      action: "complete",
      status: "active",
      status_label: "Active",
      started_at: "15 Mar 2026",
      deadline: "29 Mar 2026",
      received_at: null,
      completed_at: null,
      rating: null,
      description:
        "You are designing marketing banners and social assets. Boston is implementing the frontend components for your project dashboard.",
      deposit: 40,
    },
    {
      id: "proposal-neha",
      owner_id: "neha",
      partner_id: ownerId,
      type: "proposal",
      swapping: null,
      exchange: "Photography",
      offering: "UI Design",
      swapped: null,
      partner_name: "Dwiky Ahmad",
      timer: null,
      action: null,
      status: "pending",
      status_label: "Pending",
      started_at: null,
      deadline: null,
      received_at: "3 days ago",
      completed_at: null,
      rating: null,
      description:
        "Neha offered a full product photography session in exchange for UI design feedback on her portfolio gallery.",
      deposit: 0,
    },
    {
      id: "proposal-eric",
      owner_id: "eric",
      partner_id: ownerId,
      type: "proposal",
      swapping: null,
      exchange: "Graphic Design",
      offering: "Marketing",
      swapped: null,
      partner_name: "Dwiky Ahmad",
      timer: null,
      action: null,
      status: "pending",
      status_label: "Pending",
      started_at: null,
      deadline: null,
      received_at: "5 days ago",
      completed_at: null,
      rating: null,
      description:
        "Eric proposed a brand refresh package in exchange for help planning a launch campaign for his freelance studio.",
      deposit: 0,
    },
    {
      id: "completed-neha",
      owner_id: ownerId,
      partner_id: "neha",
      type: "completed",
      swapping: null,
      exchange: "Branding & Identity",
      offering: null,
      swapped: "Web Development",
      partner_name: "Neha Mayumi",
      timer: null,
      action: null,
      status: null,
      status_label: "Completed",
      started_at: null,
      deadline: null,
      received_at: null,
      completed_at: "1 hour ago",
      rating: "4.9",
      description:
        "You delivered a marketing site prototype. Neha provided a cohesive brand kit with typography and color rules.",
      deposit: 50,
    },
    {
      id: "completed-boston",
      owner_id: ownerId,
      partner_id: "boston",
      type: "completed",
      swapping: null,
      exchange: "SEO Strategy",
      offering: null,
      swapped: "Content Writing",
      partner_name: "Boston Thomas",
      timer: null,
      action: null,
      status: null,
      status_label: "Completed",
      started_at: null,
      deadline: null,
      received_at: null,
      completed_at: "2 weeks ago",
      rating: "4.7",
      description:
        "You wrote blog posts for Boston's product launch. He shared an SEO playbook and keyword research for your site.",
      deposit: 25,
    },
  ];

  const insert = db.prepare(
    `INSERT OR REPLACE INTO swaps (
      id, owner_id, partner_id, type, swapping, exchange, offering, swapped,
      partner_name, timer, action, status, status_label, started_at, deadline,
      received_at, completed_at, rating, description, deposit
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const swap of swaps) {
    insert.run(
      swap.id,
      swap.owner_id,
      swap.partner_id,
      swap.type,
      swap.swapping,
      swap.exchange,
      swap.offering,
      swap.swapped,
      swap.partner_name,
      swap.timer,
      swap.action,
      swap.status,
      swap.status_label,
      swap.started_at,
      swap.deadline,
      swap.received_at,
      swap.completed_at,
      swap.rating,
      swap.description,
      swap.deposit
    );
  }
}

function seedConversations(db: DatabaseSync, ownerId: string): void {
  const conversations = [
    {
      id: "athalia",
      owner_id: ownerId,
      participant_name: "Athalia Putri",
      participant_avatar: "https://i.pravatar.cc/80?u=athalia",
      participant_initials: null as string | null,
      preview: "Good morning, did you sleep well?",
      time_label: "Today",
      unread: 1,
      online: 1,
      is_active: 1,
    },
    {
      id: "raki",
      owner_id: ownerId,
      participant_name: "Raki Devon",
      participant_avatar: null,
      participant_initials: "RD",
      preview: "How is the swap going?",
      time_label: "17/6",
      unread: 2,
      online: 0,
      is_active: 0,
    },
    {
      id: "erlan",
      owner_id: ownerId,
      participant_name: "Erlan Sadewa",
      participant_avatar: "https://i.pravatar.cc/80?u=erlan",
      participant_initials: null,
      preview: "Thanks for the quick response!",
      time_label: "17/6",
      unread: 0,
      online: 0,
      is_active: 0,
    },
  ];

  const insertConversation = db.prepare(
    `INSERT OR REPLACE INTO conversations (
      id, owner_id, participant_name, participant_avatar, participant_initials,
      preview, time_label, unread, online, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const conversation of conversations) {
    insertConversation.run(
      conversation.id,
      conversation.owner_id,
      conversation.participant_name,
      conversation.participant_avatar,
      conversation.participant_initials,
      conversation.preview,
      conversation.time_label,
      conversation.unread,
      conversation.online,
      conversation.is_active
    );
  }

  db.prepare("DELETE FROM messages WHERE conversation_id = ?").run("athalia");

  const insertMessage = db.prepare(
    `INSERT INTO messages (conversation_id, direction, text, time_label, quote, message_type)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const messages = [
    {
      conversation_id: "athalia",
      direction: "incoming",
      text: "Good morning! Are we still on for the skill swap this week?",
      time_label: "16.46",
      quote: null as string | null,
      message_type: "text",
    },
    {
      conversation_id: "athalia",
      direction: "outgoing",
      text: "Yes, absolutely! I finished the first draft.",
      time_label: "16.48",
      quote: null,
      message_type: "text",
    },
    {
      conversation_id: "athalia",
      direction: "incoming",
      text: "Perfect. I reviewed your portfolio link — great work on the branding project.",
      time_label: "16.50",
      quote: "Replying to: Yes, absolutely! I finished the first draft.",
      message_type: "text",
    },
    {
      conversation_id: "athalia",
      direction: "outgoing",
      text: "Good morning, did you sleep well?",
      time_label: "09.20",
      quote: null,
      message_type: "text",
    },
  ];

  for (const message of messages) {
    insertMessage.run(
      message.conversation_id,
      message.direction,
      message.text,
      message.time_label,
      message.quote,
      message.message_type
    );
  }
}

export function seedDatabase(db: DatabaseSync): void {
  const passwordHash = bcrypt.hashSync(DEMO_PASSWORD, 10);

  for (const profile of browseProfiles) {
    upsertUser(db, profile, passwordHash, { is_browseable: true });
    replaceSkills(
      db,
      profile.id,
      profile.skills,
      profile.want_skill ? [profile.want_skill] : []
    );
  }

  upsertUser(db, demoUser, passwordHash, { is_browseable: true });
  replaceSkills(db, demoUser.id, demoUser.skillsOffer, demoUser.skillsWant);

  seedSwaps(db, demoUser.id);
  seedConversations(db, demoUser.id);
}
