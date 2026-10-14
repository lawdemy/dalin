/*
 * The "word for today" on the dashboard: one per day, the same for both of
 * us, changing at midnight in Lagos. Scripture is the King James Version and
 * the literary lines are from public-domain classics; unattributed lines were
 * written for this diary. Each of us gets one word of every kind each day,
 * and the two of us always see different ones (see wordsForDay).
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

  // More of each kind, so each of us has a month or more before repeats ----------------
  { kind: "Love", text: "Notice one thing they do for you today, and say it out loud." },
  { kind: "Love", text: "Love grows where it is watered. Water it today with patience." },
  { kind: "Love", text: "Make their coffee or tea the way they like it, without being asked." },
  { kind: "Love", text: "Put your phones down at dinner tonight and just talk." },
  { kind: "Love", text: "The safest place in the world is a kind word at the end of a long day." },
  { kind: "Love", text: "Choose curiosity over criticism today. Ask before you assume." },
  {
    kind: "Love",
    text: "Send a message in the middle of the day that simply says: thinking of you.",
  },
  { kind: "Love", text: "Forgive quickly. Let nothing sleep between you tonight." },
  {
    kind: "Love",
    text: "Celebrate what they are good at, especially if it isn't what you are good at.",
  },
  {
    kind: "Love",
    text: "Love is patient in traffic, in queues, and in the kitchen when dinner is late.",
  },
  { kind: "Love", text: "Ask how you can make their day lighter, then do it." },
  {
    kind: "Love",
    text: "Laugh at the same silly thing twice. Shared jokes are love's secret language.",
  },
  { kind: "Love", text: "Speak well of them when they are not in the room." },
  {
    kind: "Love",
    text: "Hug for a little longer than usual today. Twenty seconds is the magic number.",
  },
  { kind: "Love", text: "Be the first to say good morning and the last to say good night." },
  { kind: "Love", text: "Protect your time together the way you protect anything precious." },
  { kind: "Love", text: "Tell them about a moment this week when you felt proud of them." },
  {
    kind: "Love",
    text: "Love remembers the little things: the favourite song, the shoe size, the bad day last Tuesday.",
  },
  { kind: "Love", text: "Two hearts, one team. Face today's problem together, not each other." },
  { kind: "Love", text: "Your love is a home you build every day, one kind brick at a time." },
  { kind: "Romance", text: "You are still the first person I want to tell good news to." },
  { kind: "Romance", text: "I'd choose you in every crowd, in every city, in every lifetime." },
  {
    kind: "Romance",
    text: "Kiss them goodbye today like you mean it, even if it's only for a few hours.",
  },
  {
    kind: "Romance",
    text: "Recreate a photo from your early days together and laugh at how young you were.",
  },
  {
    kind: "Romance",
    text: "Tonight, light a candle, play your song, and forget the dishes for an hour.",
  },
  {
    kind: "Romance",
    text: "Write three words that describe them on a sticky note and leave it on the mirror.",
  },
  {
    kind: "Romance",
    text: "Falling in love was easy. Staying in love is the beautiful work of every day.",
  },
  { kind: "Romance", text: "Wear something they love seeing you in, just because." },
  { kind: "Romance", text: "Plan a surprise, however small. Romance lives in the unexpected." },
  { kind: "Romance", text: "Tell them the moment you knew. They'll never tire of hearing it." },
  { kind: "Romance", text: "Take the long way home together tonight." },
  {
    kind: "Romance",
    text: "Make a playlist of songs that remind you of each other and play it on the next drive.",
  },
  {
    kind: "Romance",
    text: "Look at them like you did on your first date. They're still that person, and more.",
  },
  {
    kind: "Romance",
    text: "Cook something together tonight, even if it's only jollof and laughter.",
  },
  {
    kind: "Romance",
    text: "Hold their face in your hands and tell them they're beautiful. Mean every word.",
  },
  {
    kind: "Romance",
    text: "Some love stories are poetry. Ours is a whole book, and we're still writing it.",
  },
  {
    kind: "Faith",
    text: "God is not finished with you, and He is not finished with your story together.",
  },
  {
    kind: "Faith",
    text: "Pray about the small things today. Nothing that matters to you is too small for Him.",
  },
  { kind: "Faith", text: "Faith is trusting the next step when you can't yet see the staircase." },
  { kind: "Faith", text: "Count your blessings out loud together tonight. Start with each other." },
  { kind: "Faith", text: "When the road is uncertain, hold His hand and each other's." },
  {
    kind: "Faith",
    text: "Peace is not the absence of storms but the presence of God in the boat.",
  },
  {
    kind: "Faith",
    text: "Read one verse together today and talk about what it means for you two.",
  },
  {
    kind: "Faith",
    text: "Thank God for the gift of each other before you ask Him for anything else.",
  },
  { kind: "Faith", text: "Your marriage is a ministry. Let your love point people to His love." },
  { kind: "Faith", text: "When you can't trace His hand, trust His heart." },
  { kind: "Faith", text: "Worship in the kitchen, pray in the car, praise in the waiting." },
  {
    kind: "Faith",
    text: "Every good thing in your life came from His hands. Say thank you today.",
  },
  { kind: "Faith", text: "Let today's decisions be made on your knees first." },
  { kind: "Faith", text: "The God who brought you together will keep you together." },
  { kind: "Faith", text: "Pray a blessing over each other before you leave the house today." },
  { kind: "Faith", text: "Hope in God is never wasted. Hold on, together." },
  {
    kind: "Faith",
    text: "Seek first His kingdom today, and watch everything else fall into place.",
  },
  { kind: "Faith", text: "Fast from complaints today: replace each one with gratitude." },
  {
    kind: "Faith",
    text: "God hears the prayers you whisper and the ones you can't put into words.",
  },
  { kind: "Faith", text: "Build your home on the Rock, and the storms will not move you." },
  {
    kind: "Faith",
    text: "His mercy met you this morning, fresh and full. Share it with each other.",
  },
  {
    kind: "Faith",
    text: "Where two agree in prayer, heaven pays attention. Agree on something today.",
  },
  {
    kind: "Motivation",
    text: "Today is a fresh page. Write something you'll be glad to read later.",
  },
  {
    kind: "Motivation",
    text: "The goal isn't to be perfect together. It's to keep growing together.",
  },
  {
    kind: "Motivation",
    text: "Do one hard thing first today. Everything after will feel lighter.",
  },
  {
    kind: "Motivation",
    text: "Your dreams are valid. Pick one and take a single step towards it before noon.",
  },
  { kind: "Motivation", text: "Discipline is choosing what you want most over what you want now." },
  {
    kind: "Motivation",
    text: "Save something today, even a little. Your future selves will thank you.",
  },
  { kind: "Motivation", text: "Be kind to yourself today. You're doing better than you think." },
  {
    kind: "Motivation",
    text: "Nothing great was built in a day, but every great thing was built daily.",
  },
  { kind: "Motivation", text: "Plan your week together on Sunday night. Teams that plan, win." },
  { kind: "Motivation", text: "Your mindset is your morning's first decision. Choose hope." },
  { kind: "Motivation", text: "Learn one new thing today and teach it to each other tonight." },
  { kind: "Motivation", text: "Comparison steals joy. Run your own race, side by side." },
  { kind: "Motivation", text: "Hard seasons build strong roots. Keep going." },
  {
    kind: "Motivation",
    text: "Finish what you started yesterday. Momentum is a gift you give yourself.",
  },
  { kind: "Motivation", text: "Drink water, move your body, say a kind word. Simple wins add up." },
  { kind: "Motivation", text: "You two are stronger than whatever today brings." },
  {
    kind: "Motivation",
    text: "Write down three things you want this year. Read them to each other.",
  },
  {
    kind: "Motivation",
    text: "Courage doesn't mean no fear. It means moving forward hand in hand anyway.",
  },
  { kind: "Motivation", text: "Turn 'someday' into a date on the calendar." },
  { kind: "Motivation", text: "Rest well tonight. Tomorrow needs the best of you both." },
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

export const WORD_KINDS: WordKind[] = ["Scripture", "Romance", "Love", "Faith", "Motivation"];

/** Each kind in its own fixed shuffled order. */
const BY_KIND = Object.fromEntries(
  WORD_KINDS.map((kind, i) => [
    kind,
    shuffled(
      DAILY_WORDS.filter((w) => w.kind === kind),
      20261014 + i * 7919,
    ),
  ]),
) as Record<WordKind, DailyWord[]>;

/**
 * One word of every kind for a diary date (yyyy-mm-dd) and viewer.
 * Each viewer walks the whole list for a kind, one step a day, so nothing
 * repeats for them until it has all been shown. The second viewer starts
 * half-way round, so on any day the two of us see different words.
 */
export function wordsForDay(date: string, viewer: 0 | 1): Record<WordKind, DailyWord> {
  const day = dayNumber(date);
  return Object.fromEntries(
    WORD_KINDS.map((kind) => {
      const list = BY_KIND[kind];
      const n = list.length;
      const offset = viewer === 1 ? Math.floor(n / 2) : 0;
      return [kind, list[(((day + offset) % n) + n) % n]];
    }),
  ) as Record<WordKind, DailyWord>;
}
