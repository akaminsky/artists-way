-- tend — exercise catalog seed (The Artist's Way, 12 weeks)
-- ===========================================================================
-- Source: the weekly Task lists the circle is working from (condensed task
-- summaries). The recurring tools that already have dedicated places in the app
-- are intentionally NOT here: Daily Morning Pages (Today card), the weekly
-- Artist Date (Today card), "read the Basic Principles / affirmations daily"
-- (a daily practice), and the weekly check-in (Check-in screen). What remains is
-- each week's specific written/active exercises.
--
-- Targets a cohort BY INVITE CODE so there's no hard-coded UUID. Re-runnable:
-- it clears this cohort's exercises first, then re-inserts.
-- NOTE: `exercises` deletes cascade to `exercise_progress` / `exercise_answers`,
-- so re-running resets everyone's exercise checkmarks + answers for this cohort.
-- Safe while no real progress exists; be deliberate about re-running later.
-- ===========================================================================

begin;

delete from public.exercises
where cohort_id = (select id from public.cohorts where invite_code = 'DU74EV');

insert into public.exercises (cohort_id, week, label, prompt, sort)
select c.id, v.week, v.label, v.prompt, v.sort
from (select id from public.cohorts where invite_code = 'DU74EV') c
cross join (values
  -- Week 1 — Recovering a Sense of Safety
  (1, 'Convert your blurts',          'At the end of each day''s morning pages, turn that day''s negative thoughts ("blurts") into positive affirmations. Read the creative affirmations daily.', 1),
  (1, 'Three creative enemies',       'Time travel: list three people who discouraged your creativity.', 2),
  (1, 'A creative wound',             'Time travel: write out one detailed story about a creative wound.', 3),
  (1, 'Defend yourself',              'Write a letter defending yourself against your creative wounds — and mail it to yourself.', 4),
  (1, 'Three creative champions',     'Time travel: list three people who encouraged your creativity.', 5),
  (1, 'Thank a champion',             'Time travel: write a thank-you letter to one of your creative champions.', 6),
  (1, 'Imaginary lives',              'List five alternative lives you''d like to live, then try an activity inspired by one of them.', 7),
  (1, 'Walk with your inner artist',  'Take a 20-minute walk on your own this week.', 8),

  -- Week 2 — Recovering a Sense of Identity
  (2, 'Time analysis',                'List five major activities from this week and analyze whether each was something you should do or want to do.', 1),
  (2, 'Sphere of influence',          'Draw a sphere of supportive people. List the people you need protection from and place them outside the circle.', 2),
  (2, 'Twenty fun activities',        'List 20 activities you enjoy, with the date you last did each.', 3),
  (2, 'Do two you''ve avoided',       'Choose two activities from your list you''ve been avoiding and do them this week.', 4),
  (2, 'Three daily affirmations',     'Review your Week 1 affirmations; write three chosen ones into your morning pages each day.', 5),
  (2, 'More imaginary lives',         'Add five more imaginary lives to your list from Week 1.', 6),
  (2, 'Life pie',                     'Draw a circle in six slices — spirituality, exercise, play, work, friends, romance/adventure — and fill each by how fulfilled you feel.', 7),
  (2, 'Ten tiny changes',            'List ten changes you''d like to make for yourself, big or small.', 8),
  (2, 'One change this week',         'Pick one small change from your list and make it your goal for the week.', 9),

  -- Week 3 — Recovering a Sense of Power
  (3, 'Your childhood room',          'Describe or draw your childhood room. What was your favorite thing about it? Could you add something like it to your space now?', 1),
  (3, 'Five childhood traits',        'List five traits you liked in yourself as a child.', 2),
  (3, 'Childhood favorites',          'List five childhood accomplishments and five childhood favorite foods — try eating one this week.', 3),
  (3, 'Habits audit',                 'List three obvious and three subtle bad habits; examine their payoffs and how to break them.', 4),
  (3, 'Friends who nurture',          'List the friends who nurture you and name their beneficial traits.', 5),
  (3, 'Call a believer',              'Call a supportive friend who believes in your capabilities.', 6),
  (3, 'Artist-brain hour',            'Spend an hour on an "artist-brain" activity that lets your mind relax and wander.', 7),
  (3, 'People you admire',            'List five people you admire openly and five you admire secretly. What traits can you cultivate?', 8),
  (3, 'Dream company',                'List five people (no longer living) you wish you''d met and five you''d keep company for eternity. What traits do you seek?', 9),
  (3, 'Compare your lists',           'Compare true admirations against perceived obligations — and follow your authentic preference.', 10),

  -- Week 4 — Recovering a Sense of Integrity
  (4, 'An extended artist date',      'Plan a small "vacation" for yourself — one weekend day. Get ready to actually execute it.', 1),
  (4, 'Reading deprivation',          'No reading this week. Notice what rushes in to fill the silence — and, if you slip, write about how and why.', 2),
  (4, 'Your ideal environment',       'Describe your ideal environment in a paragraph and find or create an image of it. Include your favorite season and why.', 3),
  (4, 'A letter from age 80',         'Time travel: picture yourself at 80. What did you accomplish? Write a letter from your 80-year-old self with advice and encouragement.', 4),
  (4, 'A letter from age 8',          'Time travel: remember yourself at 8. What did you enjoy? Write a letter from your 8-year-old self.', 5),
  (4, 'A creative space at home',     'Create a private area dedicated to creativity, with comfortable seating and inspiring elements.', 6),
  (4, 'Growth check',                 'Review your progress; note changes in activity and expression. List potential artist treats — books, magazines, tickets.', 7),
  (4, 'Your artist''s prayer',        'Write your own artist''s prayer and use it daily for a week.', 8),
  (4, 'Clear one outfit',             'Open your closet and let go of one low-self-worth outfit — toss, hand on, or donate. Make space for the new.', 9),
  (4, 'A stuck situation',            'Look at one situation you feel you should change but haven''t. What is your payoff for staying stuck?', 10),

  -- Week 5 — Recovering a Sense of Possibility
  (5, 'Your grievances',              'Write five reasons you struggle to believe in a supportive higher power. Honesty is the point.', 1),
  (5, 'Dream image file',             'List five desires you''d pursue if you had faith or money; collect images of them into one file or page.', 2),
  (5, 'Revisit imaginary lives',      'Write five alternative lives again; note what''s changed; add images to your dream image file.', 3),
  (5, 'Twenty, with means',           'Imagine being 20 with total financial freedom. List five adventures and add them to your image file.', 4),
  (5, 'Sixty-five, with means',       'Picture yourself at 65 with wealth. Note five delayed pleasures and add them to your image file.', 5),
  (5, 'Self-criticism inventory',     'Document ten ways you''re unkind to yourself, to help name and release the pattern.', 6),
  (5, 'Desire catalog',               'List ten things you wish to own; gather images and add them to your dream image file.', 7),
  (5, 'Illustrate your block',        'Identify your favorite creative block (TV, reading, etc.) and draw yourself doing it.', 8),
  (5, 'Block benefits',               'In your morning pages, explore what you gain from staying creatively blocked.', 9),
  (5, 'Block attribution',            'In your morning pages, name who you blame for your creative blocks — and process it.', 10),

  -- Week 6 — Recovering a Sense of Abundance
  (6, 'Pocket rocks',                 'Collect five interesting rocks to carry as reminders of creative consciousness.', 1),
  (6, 'Pressed flowers',              'Gather and press five flowers or leaves between wax paper.', 2),
  (6, 'Clear five items',             'Remove five old clothing items from your closet — donate or discard.', 3),
  (6, 'Make something edible',        'Make something in the kitchen — bake or prepare anything. Creativity takes many forms.', 4),
  (6, 'Five postcards',               'Send postcards to five friends you''d love to hear from.', 5),
  (6, 'Lists of favorites',           'List your favorite cars, vegetables, dogs, desserts, flowers, entrées, trees, musical groups, fruits, and colors.', 6),
  (6, 'Change your space',            'Make a change to your living space.', 7),
  (6, 'Say yes',                      'Practice saying yes to opportunities that come your way.', 8),
  (6, 'Prosperity reflection',        'Reflect on your finances and career aspirations; add inspiring images to your image file from Week 5.', 9),

  -- Week 7 — Recovering a Sense of Connection
  (7, 'A new mantra',                 'Write "Treating myself like a precious object will make me strong" beautifully, and display it where you''ll see it daily.', 1),
  (7, 'Listen to one album',          'Listen to one side of an album, uninterrupted (20 min). Try doodling while you listen.', 2),
  (7, 'Visit a sacred space',         'Spend time in quiet solitude somewhere sacred — a church, library, or nature spot.', 3),
  (7, 'A comforting atmosphere',      'Make your home comforting with pleasant scents — soup, incense, candles.', 4),
  (7, 'Dress up for nothing',         'Wear your favorite item of clothing for no special occasion.', 5),
  (7, 'Two kind purchases',           'Buy one wonderful pair of socks and one wonderfully comforting pair of gloves — something self-loving.', 6),
  (7, 'A magazine collage',           'Gather 10+ magazines, tear out 20+ images of your life and interests, and arrange them on paper (20 min).', 7),
  (7, 'Five favorite films',          'List your five favorite films and identify their common themes.', 8),
  (7, 'Favorite reading',             'Write down your favorite reading topics. Do they show up in your collage?', 9),
  (7, 'Display your collage',         'Put your collage somewhere special (private is fine) and update it now and then.', 10),

  -- Week 8 — Recovering a Sense of Strength
  (8, 'Goal search',                  'Name your dream ("In a perfect world I''d secretly love to be a…"); find your "true north"; write a five-year vision; make an action plan for the year, month, week, day, and now; choose a role model.', 1),
  (8, 'A new childhood',              'Imagine perfect nurturing and write a page of that fantasy childhood. What are ways you can self-parent now?', 2),
  (8, 'You as a color',               'Choose a color and write a few sentences describing yourself as it, in the first person. What''s your favorite color? What do you own in it?', 3),
  (8, 'Five forbidden things',        'List five "forbidden" activities and express them through art, writing, or movement.', 4),
  (8, 'Style search',                 'List 20 activities you want to do. For each: costs money or free? expensive or cheap? alone or with others? job-related? physical risk? fast or slow? mind, body, or spirit?', 5),
  (8, 'Your ideal day',               'Plan a perfect day in your life as it is now, using what you''ve learned above.', 6),
  (8, 'Your ideal ideal day',         'Plan a perfect day in your life as you wish it were — no restrictions.', 7),
  (8, 'Live one festive piece',       'Choose one festive aspect of your ideal day and let yourself actually live it.', 8),

  -- Week 9 — Recovering a Sense of Compassion
  (9, 'Read your morning pages',      'With two colored markers (one for insights, one for action items), read back your pages for patterns — without judgment, as a map of your journey.', 1),
  (9, 'Visualize your vision',        'Name your goal ("I am ___"); write your ideal scene in the present tense at the peak of your powers; build a vision board of personal photos and inspiring images.', 2),
  (9, 'Three horizons',               'Map your creative journey in three horizons — a yearly grand vision, monthly steady progress, and weekly immediate action.', 3),
  (9, 'Creative U-turns',             'Name your abandoned projects (minor, major, the one that still aches); practice radical self-forgiveness; write healing affirmations; choose one to reclaim; pick an artist totem to guard your creative self.', 4),

  -- Week 10 — Recovering a Sense of Self-Protection
  (10, 'The deadlies',                'Cut seven paper strips — alcohol, drugs, sex, work, money, food, family/friends — into an envelope. Draw one and write five ways it has harmed your life. Repeat seven times, returning each slip.', 1),
  (10, 'Touchstones list',            'Make a list of things you love — your happiness touchstones — and post it where you''ll see it.', 2),
  (10, 'The awful truth',             'Answer honestly: which bad habit blocks your creativity? Is it a problem? Will you act on it? What''s your payoff for holding on? Which friends make you doubt yourself, and which believe in you? What do you gain from keeping the doubters close?', 3),
  (10, 'A bottom line',               'Set five firm boundaries based on your most painful behaviors above.', 4),
  (10, 'Cherishing practice',         'List five small victories; three nurturing actions and three comforts for your artist; make three kind promises and keep them; do one lovely thing for yourself each day this week.', 5),

  -- Week 11 — Recovering a Sense of Autonomy
  (11, 'Record an essay',             'Record yourself reading a favorite essay from the book, and use it for meditation.', 1),
  (11, 'Carry your prayer',           'Handwrite your artist''s prayer from Week 4 and keep it in your wallet.', 2),
  (11, 'A wishes notebook',           'Make a seven-page notebook — health, possessions, leisure, relationships, creativity, career, spirituality — and list ten wishes per page.', 3),
  (11, 'Review honest changes',       'Reread the honest-changes work from Week 4 and note how you''ve changed since starting.', 4),
  (11, 'Five ways to keep changing',  'List five ways you''ll continue to change going forward.', 5),
  (11, 'Six months of nurturing',     'List five ways to nurture yourself over the next six months — courses, supplies, artist''s dates, vacations.', 6),
  (11, 'A week of self-nurture',      'Plan one week of self-nurturing, with one concrete loving action each day.', 7),
  (11, 'Letter to your inner artist', 'Write and mail an encouraging letter to your inner artist.', 8),
  (11, 'Reexamine higher power',      'Does your belief system limit or support your creative expansion? Are you open to altering your concept of it?', 9),
  (11, 'Ten synchronicities',         'List ten personal synchronicities that suggest a nurturing creative force at work.', 10),

  -- Week 12 — Recovering a Sense of Faith
  (12, 'Resistance and fear',         'Write down any resistance, anger, and fear you have about going on from here.', 1),
  (12, 'Procrastination payoffs',     'Look at where you procrastinate now. What are the payoffs in waiting? Find the hidden fears. Make a list on paper.', 2),
  (12, 'Revisit core beliefs',        'Revisit your Week 1 core negative beliefs and note your progress. Read yourself the affirmations and write some about your continued creativity.', 3),
  (12, 'Mend something',              'Mend something that has needed mending.', 4),
  (12, 'Repot your plants',           'Repot any pinched or languishing plants.', 5),
  (12, 'Make a god jar',              'Choose a jar, box, or container to hold your fears, resentments, hopes, dreams, and worries.', 6),
  (12, 'Use your god jar',            'Place this week''s fear list inside. When you worry, remind yourself it''s in the jar — then take the next action.', 7),
  (12, 'What would you create?',      'Honestly: what would you most love to create? What oddball paths would you dare? What appearances are you willing to shed to pursue it?', 8),
  (12, 'Five to dream with',          'List five people you can talk to about your dreams and plans.', 9),
  (12, 'Reread and share',            'Reread the book and share it with a friend — the miracle is one artist sharing with another.', 10)
) as v(week, label, prompt, sort);

commit;
