/*
 * The "word for today" on the dashboard: one per day, the same for both of
 * us, changing at midnight in Lagos. Scripture is the King James Version and
 * the literary lines are from public-domain classics; unattributed lines were
 * written for this diary. Days alternate between scripture and the other
 * kinds, each in a fixed shuffled order, so nothing repeats for 92 days.
 */

export type WordKind = "Scripture" | "Love" | "Romance" | "Faith" | "Motivation";

export type DailyWord = { kind: WordKind; text: string; source?: string };

export const DAILY_WORDS: DailyWord[] = [
  // Scripture (KJV) ---------------------------------------------------------------------
  {
    kind: "Scripture",
    text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    source: "Lamentations 3:22–23",
  },
  {
    kind: "Scripture",
    text: "This is the day which the LORD hath made; we will rejoice and be glad in it.",
    source: "Psalm 118:24",
  },
  {
    kind: "Scripture",
    text: "Weeping may endure for a night, but joy cometh in the morning.",
    source: "Psalm 30:5",
  },
  {
    kind: "Scripture",
    text: "Cause me to hear thy lovingkindness in the morning; for in thee do I trust.",
    source: "Psalm 143:8",
  },
  {
    kind: "Scripture",
    text: "My voice shalt thou hear in the morning, O LORD; in the morning will I direct my prayer unto thee, and will look up.",
    source: "Psalm 5:3",
  },
  {
    kind: "Scripture",
    text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.",
    source: "1 Corinthians 13:4",
  },
  {
    kind: "Scripture",
    text: "Beareth all things, believeth all things, hopeth all things, endureth all things. Charity never faileth.",
    source: "1 Corinthians 13:7–8",
  },
  {
    kind: "Scripture",
    text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.",
    source: "1 Corinthians 13:13",
  },
  {
    kind: "Scripture",
    text: "Let all your things be done with charity.",
    source: "1 Corinthians 16:14",
  },
  {
    kind: "Scripture",
    text: "Two are better than one; because they have a good reward for their labour.",
    source: "Ecclesiastes 4:9",
  },
  {
    kind: "Scripture",
    text: "And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken.",
    source: "Ecclesiastes 4:12",
  },
  {
    kind: "Scripture",
    text: "To every thing there is a season, and a time to every purpose under the heaven.",
    source: "Ecclesiastes 3:1",
  },
  {
    kind: "Scripture",
    text: "Many waters cannot quench love, neither can the floods drown it.",
    source: "Song of Solomon 8:7",
  },
  {
    kind: "Scripture",
    text: "Set me as a seal upon thine heart, as a seal upon thine arm: for love is strong as death.",
    source: "Song of Solomon 8:6",
  },
  {
    kind: "Scripture",
    text: "My beloved is mine, and I am his.",
    source: "Song of Solomon 2:16",
  },
  {
    kind: "Scripture",
    text: "I found him whom my soul loveth: I held him, and would not let him go.",
    source: "Song of Solomon 3:4",
  },
  {
    kind: "Scripture",
    text: "Thou art all fair, my love; there is no spot in thee.",
    source: "Song of Solomon 4:7",
  },
  {
    kind: "Scripture",
    text: "Whither thou goest, I will go; and where thou lodgest, I will lodge: thy people shall be my people, and thy God my God.",
    source: "Ruth 1:16",
  },
  {
    kind: "Scripture",
    text: "Whoso findeth a wife findeth a good thing, and obtaineth favour of the LORD.",
    source: "Proverbs 18:22",
  },
  {
    kind: "Scripture",
    text: "Who can find a virtuous woman? for her price is far above rubies. The heart of her husband doth safely trust in her.",
    source: "Proverbs 31:10–11",
  },
  {
    kind: "Scripture",
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    source: "Proverbs 3:5–6",
  },
  {
    kind: "Scripture",
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
    source: "Proverbs 16:3",
  },
  {
    kind: "Scripture",
    text: "What therefore God hath joined together, let not man put asunder.",
    source: "Mark 10:9",
  },
  {
    kind: "Scripture",
    text: "There is no fear in love; but perfect love casteth out fear.",
    source: "1 John 4:18",
  },
  {
    kind: "Scripture",
    text: "We love him, because he first loved us.",
    source: "1 John 4:19",
  },
  {
    kind: "Scripture",
    text: "And above all things have fervent charity among yourselves: for charity shall cover the multitude of sins.",
    source: "1 Peter 4:8",
  },
  {
    kind: "Scripture",
    text: "And above all these things put on charity, which is the bond of perfectness.",
    source: "Colossians 3:14",
  },
  {
    kind: "Scripture",
    text: "With all lowliness and meekness, with longsuffering, forbearing one another in love.",
    source: "Ephesians 4:2",
  },
  {
    kind: "Scripture",
    text: "And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ's sake hath forgiven you.",
    source: "Ephesians 4:32",
  },
  {
    kind: "Scripture",
    text: "Be kindly affectioned one to another with brotherly love; in honour preferring one another.",
    source: "Romans 12:10",
  },
  {
    kind: "Scripture",
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
    source: "Romans 8:28",
  },
  {
    kind: "Scripture",
    text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope.",
    source: "Romans 15:13",
  },
  {
    kind: "Scripture",
    text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
    source: "Jeremiah 29:11",
  },
  {
    kind: "Scripture",
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.",
    source: "Isaiah 41:10",
  },
  {
    kind: "Scripture",
    text: "They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
    source: "Isaiah 40:31",
  },
  {
    kind: "Scripture",
    text: "I can do all things through Christ which strengtheneth me.",
    source: "Philippians 4:13",
  },
  {
    kind: "Scripture",
    text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",
    source: "Philippians 4:6",
  },
  {
    kind: "Scripture",
    text: "The LORD bless thee, and keep thee: the LORD make his face shine upon thee, and be gracious unto thee: the LORD lift up his countenance upon thee, and give thee peace.",
    source: "Numbers 6:24–26",
  },
  {
    kind: "Scripture",
    text: "The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.",
    source: "Zephaniah 3:17",
  },
  {
    kind: "Scripture",
    text: "God is our refuge and strength, a very present help in trouble.",
    source: "Psalm 46:1",
  },
  {
    kind: "Scripture",
    text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.",
    source: "Psalm 37:4",
  },
  {
    kind: "Scripture",
    text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
    source: "Hebrews 11:1",
  },
  {
    kind: "Scripture",
    text: "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
    source: "Galatians 6:9",
  },
  {
    kind: "Scripture",
    text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
    source: "2 Timothy 1:7",
  },
  {
    kind: "Scripture",
    text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    source: "Joshua 1:9",
  },
  {
    kind: "Scripture",
    text: "It is not good that the man should be alone; I will make him an help meet for him.",
    source: "Genesis 2:18",
  },

  // Classic love and romance (public domain) ---------------------------------------------
  {
    kind: "Romance",
    text: "Love is not love which alters when it alteration finds.",
    source: "William Shakespeare, Sonnet 116",
  },
  {
    kind: "Romance",
    text: "My bounty is as boundless as the sea, my love as deep; the more I give to thee, the more I have, for both are infinite.",
    source: "William Shakespeare, Romeo and Juliet",
  },
  {
    kind: "Romance",
    text: "Shall I compare thee to a summer's day? Thou art more lovely and more temperate.",
    source: "William Shakespeare, Sonnet 18",
  },
  {
    kind: "Romance",
    text: "How do I love thee? Let me count the ways.",
    source: "Elizabeth Barrett Browning, Sonnet 43",
  },
  {
    kind: "Romance",
    text: "I love thee with the breath, smiles, tears, of all my life.",
    source: "Elizabeth Barrett Browning, Sonnet 43",
  },
  {
    kind: "Romance",
    text: "Whatever our souls are made of, his and mine are the same.",
    source: "Emily Brontë, Wuthering Heights",
  },
  {
    kind: "Romance",
    text: "You pierce my soul. I am half agony, half hope.",
    source: "Jane Austen, Persuasion",
  },
  {
    kind: "Romance",
    text: "You must allow me to tell you how ardently I admire and love you.",
    source: "Jane Austen, Pride and Prejudice",
  },
  {
    kind: "Love",
    text: "Grow old along with me! The best is yet to be.",
    source: "Robert Browning, Rabbi Ben Ezra",
  },
  {
    kind: "Love",
    text: "What greater thing is there for two human souls than to feel that they are joined for life.",
    source: "George Eliot, Adam Bede",
  },

  // Written for the two of you -------------------------------------------------------------
  { kind: "Love", text: "Today, choose each other again. Small kindnesses count most." },
  {
    kind: "Love",
    text: "Say “thank you” for something ordinary today. Love lives in the small things.",
  },
  { kind: "Love", text: "Home isn't a place. It's the person who saves you the last piece." },
  {
    kind: "Love",
    text: "Listen a little longer than usual today. Being heard is a kind of being held.",
  },
  {
    kind: "Love",
    text: "A good marriage is two good forgivers. Be quick to say sorry, quicker to say I love you.",
  },
  { kind: "Love", text: "Hold hands somewhere you normally wouldn't today." },
  {
    kind: "Love",
    text: "Love is a verb before it is a feeling. Do one loving thing before lunch.",
  },
  { kind: "Love", text: "Ask each other tonight: what was the best part of your day?" },
  { kind: "Romance", text: "Of all the mornings in the world, I'm glad this one starts with you." },
  { kind: "Romance", text: "Every love story is beautiful, but ours is my favourite page." },
  {
    kind: "Romance",
    text: "Write it down: one thing you loved about them this week. Then tell them.",
  },
  {
    kind: "Romance",
    text: "Plan a tiny date: tea on the balcony, a walk at sunset, your song in the kitchen.",
  },
  { kind: "Romance", text: "Look at them across the room today, just because you can." },
  { kind: "Romance", text: "The best days are the ones that become stories. Make one today." },
  {
    kind: "Faith",
    text: "Pray for each other by name today. It is the quietest way to say I love you.",
  },
  { kind: "Faith", text: "What God has started in you two, He is faithful to finish." },
  {
    kind: "Faith",
    text: "Bring today's worries to God before you bring them to each other, then carry the rest together.",
  },
  { kind: "Faith", text: "Grace for today is enough for today. Tomorrow will have its own." },
  { kind: "Faith", text: "Give thanks for one answered prayer you almost forgot." },
  {
    kind: "Faith",
    text: "Let your home be a place where faith is spoken, kindness is practised and laughter is loud.",
  },
  { kind: "Motivation", text: "Small steps, taken together, cover long roads." },
  { kind: "Motivation", text: "Be brave enough to start, patient enough to keep going." },
  { kind: "Motivation", text: "Your future is being built by what you do today, not tomorrow." },
  {
    kind: "Motivation",
    text: "Cheer each other on loudly today. Everyone works harder when someone believes in them.",
  },
  { kind: "Motivation", text: "Done with love is better than perfect." },
  { kind: "Motivation", text: "Celebrate a small win today. It's practice for the big ones." },
  { kind: "Motivation", text: "Rest is not quitting. Breathe, then go again." },
  {
    kind: "Motivation",
    text: "Dream big together, then write the first small step on today's list.",
  },
  { kind: "Love", text: "Leave a little note somewhere they'll find it today." },
  { kind: "Love", text: "The way you speak to each other on hard days is the real love story." },
  { kind: "Romance", text: "Slow dance in the kitchen tonight. No music needed." },
  { kind: "Romance", text: "Remember your first date? Tell them one detail they've forgotten." },
  { kind: "Faith", text: "Start the day with a short prayer together, even just a sentence each." },
  { kind: "Faith", text: "God's timing is not late. Wait with hope, together." },
  { kind: "Motivation", text: "Be each other's safe place and each other's biggest push." },
  { kind: "Motivation", text: "Progress, not perfection. Look how far you've come together." },
];

/** Days since 1 Jan 2026 for a yyyy-mm-dd date (calendar days, no time zone drift). */
function dayNumber(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(2026, 0, 1)) / 86_400_000);
}

/** Small seeded PRNG (mulberry32), so every cycle has its own fixed order. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fixed shuffle of `items` (seeded, so it never changes between deploys). */
function shuffled<T>(items: T[], seed: number): T[] {
  const out = [...items];
  const random = seeded(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Scripture and the other kinds alternate day by day; any extras go at the end. */
const ORDER: DailyWord[] = (() => {
  const scripture = shuffled(
    DAILY_WORDS.filter((w) => w.kind === "Scripture"),
    20261014,
  );
  const others = shuffled(
    DAILY_WORDS.filter((w) => w.kind !== "Scripture"),
    14102026,
  );
  const out: DailyWord[] = [];
  for (let i = 0; i < Math.max(scripture.length, others.length); i++) {
    if (scripture[i]) out.push(scripture[i]);
    if (others[i]) out.push(others[i]);
  }
  return out;
})();

/** The word for a given diary date (yyyy-mm-dd). Same date, same word. */
export function wordForDay(date: string): DailyWord {
  const n = ORDER.length;
  return ORDER[((dayNumber(date) % n) + n) % n];
}
