/**
 * What the voice guide says for each move, so a session talks you through it like a coach rather than just timing it.
 *
 * - `kind`: a `hold` is a stretch you ease into and stay in; a `flow` keeps moving (rolls, circles, rocks, reps).
 *   It decides how the time is said: "Hold for 30 seconds" or "Keep going for 30 seconds".
 * - `setup`: how to get into position, said during the rest before the move.
 * - `go`: the movement itself, said as the timer starts.
 * - `cues`: form and breathing reminders, spread through the move by `lib/guide.ts`.
 * - `half`: said at halfway, for moves that change part way (circles change direction).
 * - `other`: for two-sided moves, how to change to the second side, said in the switch break.
 *
 * Keep lines short and calm: they're spoken over a running timer and shown under the picture.
 */
export type MoveGuide = {
  kind: 'hold' | 'flow';
  setup: string;
  go: string;
  cues: string[];
  half?: string;
  other?: string;
};

export const GUIDES: Record<string, MoveGuide> = {
  // Neck
  'neck-tuck': {
    kind: 'flow',
    setup: 'Sit or stand tall, shoulders relaxed, eyes looking straight ahead.',
    go: 'Draw your chin straight back, hold for a breath, then let it go.',
    cues: ['Keep your eyes level, as if your head slides back on a shelf.', 'Small and slow. No need to tip your head down.', 'Feel the back of your neck lengthen each time.'],
  },
  'neck-tilt': {
    kind: 'hold',
    setup: 'Sit or stand tall and let your shoulders drop.',
    go: 'Slowly tilt one ear towards your shoulder.',
    cues: ['Keep the other shoulder low and heavy.', 'Breathe out and let your neck soften.', 'Stay at a gentle pull, never a strain.'],
    other: 'Bring your head back to the middle, then tilt towards the other shoulder.',
  },
  'neck-turn': {
    kind: 'flow',
    setup: 'Sit tall with your shoulders relaxed.',
    go: 'Turn your head slowly to look over one shoulder, pause, then turn to the other.',
    cues: ['Lead with your eyes and let your head follow.', 'Keep your chin level and your shoulders still.', 'Pause for a breath at each side.'],
  },
  'neck-roll': {
    kind: 'flow',
    setup: 'Sit or stand tall and let your chin drop towards your chest.',
    go: 'Roll your chin slowly from one shoulder to the other, across the front.',
    cues: ['Let the weight of your head do the work.', 'Keep it to a half circle, across the front only.', 'Breathe slowly, and pause anywhere that feels tight.'],
  },
  'neck-levator': {
    kind: 'hold',
    setup: 'Sit tall and hold the edge of your seat with one hand.',
    go: 'Turn your head away from that hand and look down towards your other armpit.',
    cues: ['Rest your free hand on your head, without pulling.', 'Let the shoulder of your holding arm sink down.', 'Breathe out and feel the back of your neck lengthen.'],
    other: 'Change hands, then look down towards your other armpit.',
  },

  // Shoulders
  'sh-reach': {
    kind: 'hold',
    setup: 'Stand tall with your feet hip-width apart.',
    go: 'Reach both arms up overhead and lengthen through your sides.',
    cues: ['Keep your ribs soft. No need to arch your back.', 'Breathe in and grow a little taller.', 'Let your shoulders drop away from your ears.'],
  },
  'sh-cross': {
    kind: 'hold',
    setup: 'Stand or sit tall with your shoulders relaxed.',
    go: 'Bring one arm across your chest and hold it with your other hand.',
    cues: ['Hold above the elbow, not on the joint.', 'Keep both shoulders down and level.', 'Breathe out and ease the arm a little closer.'],
    other: 'Let go, and bring your other arm across your chest.',
  },
  'sh-rolls': {
    kind: 'flow',
    setup: 'Stand or sit tall, arms relaxed by your sides.',
    go: 'Lift your shoulders up to your ears, roll them back, and let them drop.',
    cues: ['Make each circle big and slow.', 'Squeeze your shoulder blades together as you roll back.', 'Breathe in as you lift, out as you drop.'],
  },
  'sh-goalpost': {
    kind: 'flow',
    setup: 'Stand tall and lift your arms into a goalpost, elbows at shoulder height.',
    go: 'Slowly raise your arms overhead, then lower them back into the goalpost.',
    cues: ['Keep the shape: elbows bent, palms facing forward.', 'Keep your ribs down as your arms go up.', 'Slow on the way down, and squeeze between your shoulder blades.'],
  },
  'sh-sidebend': {
    kind: 'hold',
    setup: 'Stand tall with your feet hip-width apart.',
    go: 'Reach one arm up and lean gently over to the opposite side.',
    cues: ['Keep both feet grounded and your hips still.', 'Breathe into the long side of your body.', 'Reach up and over, rather than down.'],
    other: 'Come back up through the middle, then reach the other arm up and over.',
  },
  'sh-doorway': {
    kind: 'hold',
    setup: 'Stand side-on in a doorway, one palm flat on the frame behind you at shoulder height.',
    go: 'Step forward gently until you feel a stretch across your chest.',
    cues: ['Keep your arm straight and your shoulder down.', 'Breathe slowly into your chest.', 'Ease off if you feel any tingling in your arm.'],
    other: 'Turn around and place your other palm on the frame.',
  },

  // Elbows
  'el-circles': {
    kind: 'flow',
    setup: 'Stand tall with your arms out to the sides.',
    go: 'Draw small, slow circles with your arms.',
    cues: ['Let the circles grow a little each time.', 'Keep your shoulders down and your arms long.'],
    half: 'Now change direction.',
  },
  'el-bend': {
    kind: 'hold',
    setup: 'Stand or sit tall.',
    go: 'Reach one arm up, bend the elbow so your hand drops behind your head, and hold the elbow with your other hand.',
    cues: ['Ease the elbow gently back.', 'Keep your head tall.', 'Breathe into the back of your arm.'],
    other: 'Lower that arm, and reach the other one up.',
  },
  'el-turn': {
    kind: 'flow',
    setup: 'Tuck your elbows in at your sides, forearms pointing forward.',
    go: 'Turn your palms up as far as they go, then turn them down.',
    cues: ['Keep your elbows still.', 'Slow, full turns each way.', 'Feel your forearms twist and untwist.'],
  },
  'el-wall': {
    kind: 'hold',
    setup: 'Stand side-on to a wall.',
    go: 'Reach the near arm back, press your palm flat on the wall, and turn your chest away.',
    cues: ['Keep your shoulder down.', 'Turn away a little more as you breathe out.', 'Stop where you feel it along the front of your arm.'],
    other: 'Turn around, and reach your other arm back to the wall.',
  },
  'el-extensor': {
    kind: 'hold',
    setup: 'Hold one arm out in front, elbow straight, palm facing down.',
    go: 'With your other hand, gently bend the wrist so your fingers point down.',
    cues: ['Keep the elbow straight.', 'Feel it along the top of your forearm.', 'Breathe out and let your hand relax.'],
    other: 'Change arms: the other arm out in front, palm down.',
  },

  // Wrists
  'wr-circles': {
    kind: 'flow',
    setup: 'Hold your arms out in front, hands relaxed.',
    go: 'Draw slow circles with your hands.',
    cues: ['Keep your forearms still. Only the wrists move.', 'Make the circles as big as you can.'],
    half: 'Now change direction.',
  },
  'wr-prayer': {
    kind: 'hold',
    setup: 'Press your palms together in front of your chest.',
    go: 'Keep your palms together and lower your hands until you feel the stretch.',
    cues: ['Let your elbows lift out to the sides.', 'Keep the heels of your hands pressed together.', 'Keep your shoulders relaxed.'],
  },
  'wr-pull': {
    kind: 'hold',
    setup: 'Reach one arm straight out in front at shoulder height.',
    go: 'Bend the wrist back, fingers up like a stop sign, and draw them gently back with your other hand.',
    cues: ['Keep the elbow straight.', 'Feel it along the inside of your forearm.', 'Gently. Ease off if your wrist complains.'],
    other: 'Change arms: the other arm out in front.',
  },
  'wr-table': {
    kind: 'flow',
    setup: 'Come onto your hands and knees, palms flat, fingers spread.',
    go: 'Rock your weight forward over your wrists, then back.',
    cues: ['Keep your palms flat on the floor.', 'Only go as far as is comfortable.', 'Slow and easy, forward and back.'],
  },
  'wr-reverse': {
    kind: 'hold',
    setup: 'Bring your palms together behind your back, fingers pointing down.',
    go: 'Turn your fingers up if you can, and slide your hands up your back.',
    cues: ['Roll your shoulders back and open your chest.', 'Fingers down is fine if this is too much.', 'Breathe slowly.'],
  },

  // Upper back
  'ub-catcow': {
    kind: 'flow',
    setup: 'Come onto your hands and knees, wrists under shoulders, knees under hips.',
    go: 'Breathe out and round your back up. Breathe in and let your belly dip.',
    cues: ['Let your head follow: down as you round, up as you dip.', 'Move slowly, one part of your spine at a time.', 'Breathe out, round. Breathe in, dip.', 'Keep your arms straight and your weight even.'],
  },
  'ub-thread': {
    kind: 'hold',
    setup: 'Come onto your hands and knees.',
    go: 'Slide one arm under your body, palm up, and rest that shoulder and your head down.',
    cues: ['Keep your hips up over your knees.', 'Let your upper back twist a little more as you breathe out.', 'Press gently into your other hand for support.'],
    other: 'Come back onto your hands, then thread the other arm through.',
  },
  'ub-twist': {
    kind: 'hold',
    setup: 'Sit tall on the floor, legs crossed.',
    go: 'Turn your chest to one side and place that hand on the floor behind you.',
    cues: ['Grow tall as you breathe in.', 'Turn a little further as you breathe out.', 'Keep your hips facing forward.'],
    other: 'Come back to the middle, then turn the other way.',
  },
  'ub-hug': {
    kind: 'hold',
    setup: 'Stand or sit tall.',
    go: 'Cross your arms, reach for your shoulder blades, and round your upper back.',
    cues: ['Drop your chin a little.', 'Breathe into the space between your shoulder blades.'],
    half: 'Now swap which arm is on top.',
  },
  'ub-wall': {
    kind: 'flow',
    setup: 'Stand with your back, head and bottom against a wall, feet a small step forward.',
    go: 'Bring your arms into a goalpost on the wall, then slide them slowly up and down.',
    cues: ['Keep your elbows and hands touching the wall if you can.', 'Ribs down. Don’t let your back arch.', 'Only go as high as you can keep contact.'],
  },
  'ub-puppy': {
    kind: 'hold',
    setup: 'Come onto your hands and knees.',
    go: 'Walk your hands forward, keep your hips over your knees, and let your chest sink down.',
    cues: ['Rest your forehead on the floor.', 'Keep your arms long and your hips high.', 'Breathe out and let your chest melt a little lower.'],
  },
  'ub-lat': {
    kind: 'hold',
    setup: 'Sit back into child’s pose with your arms long in front of you.',
    go: 'Walk both hands over to one side until the other side of your body opens.',
    cues: ['Sink your hips back towards your heels.', 'Breathe into the ribs on the long side.', 'Let your forehead rest down.'],
    other: 'Walk your hands back to the middle, then over to the other side.',
  },

  // Lower back
  'lb-child': {
    kind: 'hold',
    setup: 'Kneel, and sit back towards your heels.',
    go: 'Walk your hands forward, arms long, and rest your forehead down.',
    cues: ['Let your hips sink towards your heels.', 'Breathe slowly into your lower back.', 'Let your shoulders soften.', 'Widen your knees if that feels better.'],
  },
  'lb-hug': {
    kind: 'flow',
    setup: 'Lie on your back.',
    go: 'Hug both knees towards your chest and rock gently from side to side.',
    cues: ['Keep your head and shoulders heavy on the floor.', 'Small, easy rocks. Let your lower back unwind.', 'Breathe slowly.'],
  },
  'lb-seated': {
    kind: 'hold',
    setup: 'Sit tall with your legs out in front of you.',
    go: 'Reach forward from your hips towards your feet.',
    cues: ['Keep your back long rather than rounded.', 'Soft knees are fine.', 'Breathe out and ease a little further forward.'],
  },
  'lb-sphinx': {
    kind: 'hold',
    setup: 'Lie on your front with your elbows under your shoulders.',
    go: 'Press into your forearms and gently lift your chest.',
    cues: ['Let your belly and hips stay heavy.', 'Draw your shoulders down and back.', 'Breathe slowly into your lower back.'],
  },
  'lb-twist': {
    kind: 'hold',
    setup: 'Lie on your back, knees bent, feet flat, arms out wide.',
    go: 'Let both knees fall slowly over to one side.',
    cues: ['Keep both shoulders on the floor.', 'Let gravity do the work.', 'Turn your head the other way if it feels good.'],
    other: 'Bring your knees back up through the middle, then let them fall the other way.',
  },
  'lb-cobra': {
    kind: 'hold',
    setup: 'Lie on your front with your hands under your shoulders.',
    go: 'Press gently through your hands and lift your chest.',
    cues: ['Keep your hips on the floor.', 'Shoulders down, away from your ears.', 'Only come up as far as feels good in your back.'],
  },
  'lb-bridge': {
    kind: 'flow',
    setup: 'Lie on your back, knees bent, feet flat and hip-width apart.',
    go: 'Squeeze your glutes and lift your hips, then lower slowly.',
    cues: ['Lift until you’re in a straight line from shoulders to knees.', 'Push through your heels.', 'Lower slowly, one part of your back at a time.'],
  },
  'lb-fold': {
    kind: 'hold',
    setup: 'Stand with your feet hip-width apart.',
    go: 'Soften your knees and fold forward from your hips. Let your head and arms hang.',
    cues: ['Bend your knees as much as you need.', 'Let your neck relax completely.', 'Breathe into the backs of your legs.'],
  },
  'lb-birddog': {
    kind: 'flow',
    setup: 'Come onto your hands and knees, hands under shoulders, knees under hips.',
    go: 'Reach one arm forward and the opposite leg back, pause, then lower them.',
    cues: ['Keep your back still, like a table.', 'Reach long, not high.', 'Slow and steady. Pause each time you reach.'],
    other: 'Now the other arm and the other leg.',
  },

  // Hips
  'hip-butterfly': {
    kind: 'hold',
    setup: 'Sit tall and bring the soles of your feet together.',
    go: 'Hold your feet and let your knees fall open.',
    cues: ['Sit up tall through your spine.', 'Let your knees grow heavy. No need to push them.', 'Lean forward a little if it feels good.', 'Breathe into your hips.'],
  },
  'hip-lunge': {
    kind: 'hold',
    setup: 'Step one foot forward and lower your back knee to the floor.',
    go: 'Hands on your front knee. Keep your chest tall and ease your hips forward.',
    cues: ['Squeeze the glute of your back leg.', 'Keep your front knee over your ankle.', 'Breathe into the front of your back hip.'],
    other: 'Step back, and bring the other foot forward.',
  },
  'hip-fig4': {
    kind: 'hold',
    setup: 'Lie on your back with your knees bent.',
    go: 'Cross one ankle over the other knee, then hold behind your thigh and draw both legs in.',
    cues: ['Keep your head and shoulders relaxed on the floor.', 'Let the crossed knee open away from you.', 'Breathe out and draw in a little more.'],
    other: 'Uncross, and cross your other ankle over.',
  },
  'hip-swing': {
    kind: 'flow',
    setup: 'Stand side-on to a wall and hold it with your near hand.',
    go: 'Swing your outside leg forward and back, smooth and controlled.',
    cues: ['Stay tall, and let the swing grow a little each time.', 'Keep your standing knee soft.', 'Control it. No kicking.'],
    other: 'Turn around, hold the wall with your other hand, and swing the other leg.',
  },
  'hip-squat': {
    kind: 'hold',
    setup: 'Stand with your feet a little wider than your hips, toes turned out slightly.',
    go: 'Sink down into a squat, heels down, chest up.',
    cues: ['Press your elbows gently against your knees.', 'Hold on to something if you need to.', 'Breathe slowly and let your hips sink.'],
  },
  'hip-pigeon': {
    kind: 'hold',
    setup: 'From your hands and knees, bring one shin forward across your mat.',
    go: 'Slide your other leg long behind you and let your hips settle.',
    cues: ['Stay tall, or fold forward over your shin.', 'Keep your hips level.', 'Ease off if you feel it in your knee.'],
    other: 'Come back to your hands and knees, then bring the other shin forward.',
  },
  'hip-sidelunge': {
    kind: 'hold',
    setup: 'Stand with your feet wide apart, toes pointing forward.',
    go: 'Bend one knee and sit your hips back over that leg.',
    cues: ['Keep the other leg straight, toes up.', 'Chest up, back long.', 'Sit a little lower as you breathe out.'],
    other: 'Come back through the middle, then sit into the other side.',
  },
  'hip-wgs': {
    kind: 'flow',
    setup: 'Step into a long lunge and put both hands on the floor inside your front foot.',
    go: 'Turn your chest open and reach your inside arm to the ceiling, then lower it.',
    cues: ['Follow your hand with your eyes.', 'Keep your back leg long.', 'Breathe in as you reach up, out as you lower.'],
    other: 'Step the other foot forward, both hands down inside it.',
  },

  // Knees
  'kn-quad': {
    kind: 'hold',
    setup: 'Stand tall and hold a wall for balance.',
    go: 'Bend one knee and hold that foot behind you.',
    cues: ['Keep your knees side by side.', 'Push your hips gently forward.', 'Stand tall. No leaning forward.'],
    other: 'Let go, and hold your other foot behind you.',
  },
  'kn-lyingham': {
    kind: 'hold',
    setup: 'Lie on your back with both knees bent.',
    go: 'Straighten one leg up towards the ceiling, holding behind your thigh.',
    cues: ['Keep your lower back on the floor.', 'A soft knee is fine.', 'Draw the leg in a little, only as far as is comfortable.'],
    other: 'Lower that leg, and lift the other one.',
  },
  'kn-slides': {
    kind: 'flow',
    setup: 'Lie on your back with your legs long.',
    go: 'Slide one heel towards you, bending the knee, then slide it back out.',
    cues: ['Nice and slow. Keep it smooth.', 'Bend only as far as is comfortable.', 'Keep your other leg relaxed.'],
    other: 'Now slide the other heel.',
  },
  'kn-heelsit': {
    kind: 'hold',
    setup: 'Kneel with your knees together, tops of your feet flat.',
    go: 'Sit back towards your heels, and sit tall.',
    cues: ['Put a cushion behind your knees if they complain.', 'Rest your hands on your thighs.', 'Breathe slowly and let your weight settle.'],
  },
  'kn-couch': {
    kind: 'hold',
    setup: 'Kneel with your back shin up a wall or sofa, and your other foot forward.',
    go: 'Lift your chest upright and squeeze your glute.',
    cues: ['Keep your front knee over your ankle.', 'Lean forward a little to ease off if it’s too strong.', 'Breathe slowly into the front of your hip.'],
    other: 'Come out slowly and switch legs, the other shin up the wall.',
  },

  // Ankles
  'an-rock': {
    kind: 'flow',
    setup: 'Half kneel with one foot forward.',
    go: 'Rock your front knee forward over your toes, then back.',
    cues: ['Keep your front heel down.', 'Go a little further each time.', 'Hands on your knee, chest tall.'],
    other: 'Switch legs, and bring the other foot forward.',
  },
  'an-circles': {
    kind: 'flow',
    setup: 'Sit with one leg out in front of you.',
    go: 'Draw big, slow circles with your foot.',
    cues: ['Move from the ankle and keep your leg still.', 'Make the circles as big as you can.'],
    half: 'Now change direction.',
    other: 'Now the other foot.',
  },
  'an-calf': {
    kind: 'hold',
    setup: 'Face a wall with your hands on it.',
    go: 'Step one foot back and lean in, keeping that heel down.',
    cues: ['Keep your back leg straight.', 'Press your back heel into the floor.', 'Lean in a little further as you breathe out.'],
    other: 'Bring that foot in, and step the other one back.',
  },
  'an-dog': {
    kind: 'hold',
    setup: 'Come onto your hands and knees and tuck your toes.',
    go: 'Lift your hips up and back into an upside-down V.',
    cues: ['Press the floor away with your hands.', 'Bend your knees if your back rounds.', 'Gently press your heels towards the floor.'],
  },
  'an-squat': {
    kind: 'flow',
    setup: 'Sink into a deep squat, heels down.',
    go: 'Shift your weight slowly onto one foot, then over to the other.',
    cues: ['Let your knee travel forward over your toes.', 'Keep both heels down.', 'Slow and smooth, side to side.'],
  },

  // Feet
  'ft-spread': {
    kind: 'flow',
    setup: 'Sit with your legs out and your feet relaxed.',
    go: 'Spread your toes as wide as they go, hold for a breath, then relax them.',
    cues: ['Try to make a gap between every toe.', 'Relax them fully each time.', 'It gets easier with practice.'],
  },
  'ft-flex': {
    kind: 'flow',
    setup: 'Sit with one leg out in front of you.',
    go: 'Pull your toes back towards you, then point them away.',
    cues: ['Slow and full, all the way each way.', 'Keep your leg still.', 'Feel your shin, then your calf.'],
    other: 'Now the other foot.',
  },
  'ft-raise': {
    kind: 'flow',
    setup: 'Stand with your feet hip-width apart, near something to hold.',
    go: 'Rise up onto your toes, pause, then lower slowly.',
    cues: ['Lower down slower than you go up.', 'Keep your weight over your big toes.', 'Stay tall the whole time.'],
  },
  'ft-toes': {
    kind: 'hold',
    setup: 'Kneel with your toes tucked under.',
    go: 'Sit back gently towards your heels.',
    cues: ['Ease off if it’s too much.', 'Hands on your thighs, back tall.', 'Breathe slowly. It eases the longer you stay.'],
  },
  'ft-arch': {
    kind: 'flow',
    setup: 'Stand with your feet flat and your toes relaxed.',
    go: 'Draw the ball of your foot towards your heel to lift your arch, hold, then relax.',
    cues: ['Keep your toes long. Don’t curl them.', 'It’s a small movement, and that’s fine.', 'Hold each lift for a breath.'],
  },
  'ft-plantar': {
    kind: 'hold',
    setup: 'Sit and cross one foot over the opposite knee.',
    go: 'Hold your toes and gently pull them back towards your shin.',
    cues: ['Feel the stretch along the sole of your foot.', 'Hold your ankle with your other hand.', 'Breathe slowly.'],
    other: 'Change feet: cross the other foot over.',
  },
};
