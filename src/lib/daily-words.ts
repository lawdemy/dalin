/*
 * The "word for today" on the dashboard: one per day, the same for both of
 * us, changing at midnight in Lagos. Scripture is the New International Version
 * (NIV, quoted under Biblica's 500-verse permission; see NIV_NOTICE) and
 * the literary lines are from public-domain classics; unattributed lines were
 * written for this diary. Each of us gets one word of every kind each day,
 * and the two of us always see different ones (see wordsForDay).
 */

export type WordKind = "Scripture" | "Love" | "Romance" | "Faith" | "Motivation";

export type DailyWord = { kind: WordKind; text: string; source?: string };

/** Required by Biblica when quoting the NIV (up to 500 verses without written permission). */
export const NIV_NOTICE =
  "Scripture quotations taken from The Holy Bible, New International Version® NIV®. Copyright © 1973, 1978, 1984, 2011 by Biblica, Inc.™ Used by permission. All rights reserved worldwide.";

export const DAILY_WORDS: DailyWord[] = [
  // Scripture (KJV) ---------------------------------------------------------------------
  {
    kind: "Scripture",
    text: "Because of the LORD's great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.",
    source: "Lamentations 3:22–23",
  },
  {
    kind: "Scripture",
    text: "The LORD has done it this very day; let us rejoice today and be glad.",
    source: "Psalm 118:24",
  },
  {
    kind: "Scripture",
    text: "Weeping may stay for the night, but rejoicing comes in the morning.",
    source: "Psalm 30:5",
  },
  {
    kind: "Scripture",
    text: "Let the morning bring me word of your unfailing love, for I have put my trust in you.",
    source: "Psalm 143:8",
  },
  {
    kind: "Scripture",
    text: "In the morning, LORD, you hear my voice; in the morning I lay my requests before you and wait expectantly.",
    source: "Psalm 5:3",
  },
  {
    kind: "Scripture",
    text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
    source: "1 Corinthians 13:4",
  },
  {
    kind: "Scripture",
    text: "It always protects, always trusts, always hopes, always perseveres. Love never fails.",
    source: "1 Corinthians 13:7–8",
  },
  {
    kind: "Scripture",
    text: "And now these three remain: faith, hope and love. But the greatest of these is love.",
    source: "1 Corinthians 13:13",
  },
  {
    kind: "Scripture",
    text: "Do everything in love.",
    source: "1 Corinthians 16:14",
  },
  {
    kind: "Scripture",
    text: "Two are better than one, because they have a good return for their labor.",
    source: "Ecclesiastes 4:9",
  },
  {
    kind: "Scripture",
    text: "Though one may be overpowered, two can defend themselves. A cord of three strands is not quickly broken.",
    source: "Ecclesiastes 4:12",
  },
  {
    kind: "Scripture",
    text: "There is a time for everything, and a season for every activity under the heavens.",
    source: "Ecclesiastes 3:1",
  },
  {
    kind: "Scripture",
    text: "Many waters cannot quench love; rivers cannot sweep it away.",
    source: "Song of Solomon 8:7",
  },
  {
    kind: "Scripture",
    text: "Place me like a seal over your heart, like a seal on your arm; for love is as strong as death.",
    source: "Song of Solomon 8:6",
  },
  {
    kind: "Scripture",
    text: "My beloved is mine and I am his.",
    source: "Song of Solomon 2:16",
  },
  {
    kind: "Scripture",
    text: "I found the one my heart loves. I held him and would not let him go.",
    source: "Song of Solomon 3:4",
  },
  {
    kind: "Scripture",
    text: "You are altogether beautiful, my darling; there is no flaw in you.",
    source: "Song of Solomon 4:7",
  },
  {
    kind: "Scripture",
    text: "Where you go I will go, and where you stay I will stay. Your people will be my people and your God my God.",
    source: "Ruth 1:16",
  },
  {
    kind: "Scripture",
    text: "He who finds a wife finds what is good and receives favor from the LORD.",
    source: "Proverbs 18:22",
  },
  {
    kind: "Scripture",
    text: "A wife of noble character who can find? She is worth far more than rubies. Her husband has full confidence in her and lacks nothing of value.",
    source: "Proverbs 31:10–11",
  },
  {
    kind: "Scripture",
    text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    source: "Proverbs 3:5–6",
  },
  {
    kind: "Scripture",
    text: "Commit to the LORD whatever you do, and he will establish your plans.",
    source: "Proverbs 16:3",
  },
  {
    kind: "Scripture",
    text: "Therefore what God has joined together, let no one separate.",
    source: "Mark 10:9",
  },
  {
    kind: "Scripture",
    text: "There is no fear in love. But perfect love drives out fear.",
    source: "1 John 4:18",
  },
  {
    kind: "Scripture",
    text: "We love because he first loved us.",
    source: "1 John 4:19",
  },
  {
    kind: "Scripture",
    text: "Above all, love each other deeply, because love covers over a multitude of sins.",
    source: "1 Peter 4:8",
  },
  {
    kind: "Scripture",
    text: "And over all these virtues put on love, which binds them all together in perfect unity.",
    source: "Colossians 3:14",
  },
  {
    kind: "Scripture",
    text: "Be completely humble and gentle; be patient, bearing with one another in love.",
    source: "Ephesians 4:2",
  },
  {
    kind: "Scripture",
    text: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
    source: "Ephesians 4:32",
  },
  {
    kind: "Scripture",
    text: "Be devoted to one another in love. Honor one another above yourselves.",
    source: "Romans 12:10",
  },
  {
    kind: "Scripture",
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    source: "Romans 8:28",
  },
  {
    kind: "Scripture",
    text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.",
    source: "Romans 15:13",
  },
  {
    kind: "Scripture",
    text: "“For I know the plans I have for you,” declares the LORD, “plans to prosper you and not to harm you, plans to give you hope and a future.”",
    source: "Jeremiah 29:11",
  },
  {
    kind: "Scripture",
    text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
    source: "Isaiah 41:10",
  },
  {
    kind: "Scripture",
    text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    source: "Isaiah 40:31",
  },
  {
    kind: "Scripture",
    text: "I can do all this through him who gives me strength.",
    source: "Philippians 4:13",
  },
  {
    kind: "Scripture",
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    source: "Philippians 4:6",
  },
  {
    kind: "Scripture",
    text: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you; the LORD turn his face toward you and give you peace.",
    source: "Numbers 6:24–26",
  },
  {
    kind: "Scripture",
    text: "The LORD your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.",
    source: "Zephaniah 3:17",
  },
  {
    kind: "Scripture",
    text: "God is our refuge and strength, an ever-present help in trouble.",
    source: "Psalm 46:1",
  },
  {
    kind: "Scripture",
    text: "Take delight in the LORD, and he will give you the desires of your heart.",
    source: "Psalm 37:4",
  },
  {
    kind: "Scripture",
    text: "Now faith is confidence in what we hope for and assurance about what we do not see.",
    source: "Hebrews 11:1",
  },
  {
    kind: "Scripture",
    text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    source: "Galatians 6:9",
  },
  {
    kind: "Scripture",
    text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
    source: "2 Timothy 1:7",
  },
  {
    kind: "Scripture",
    text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.",
    source: "Joshua 1:9",
  },
  {
    kind: "Scripture",
    text: "The LORD God said, “It is not good for the man to be alone. I will make a helper suitable for him.”",
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
