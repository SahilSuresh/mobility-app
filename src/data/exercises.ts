import type { AreaId, Exercise } from './types';

/**
 * The library: 62 moves across the 10 areas and 3 levels, at least three beginner moves per area.
 * Every move earns its place: `why` says what it does for you, and `careful` says when to ease off.
 * Add more here, using an existing pose or a new one in poses.ts.
 */
export const EXERCISES: Exercise[] = [
  // Neck
  {
    id: 'neck-tuck', name: 'Chin tucks', area: 'neck', level: 1, pose: 'chinTuck', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['everyday', 'stiffness'],
    tip: 'Draw your chin straight back, then relax.',
    why: 'Strengthens the deep neck muscles that hold your head over your shoulders, undoing the forward-head posture screens build.',
    steps: ['Sit or stand tall.', 'Gently draw your chin straight back.', 'Hold for a breath, then relax.'],
  },
  {
    id: 'neck-tilt', name: 'Neck side tilt', area: 'neck', level: 1, pose: 'neck', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['stiffness', 'everyday'],
    tip: 'Ear towards shoulder. Keep the other shoulder low.',
    why: 'Lengthens the upper traps along the side of your neck, where tension from stress and hunched shoulders collects.',
    steps: ['Sit or stand tall.', 'Tilt your ear towards your shoulder.', 'Keep the other shoulder relaxed and low.'],
  },
  {
    id: 'neck-turn', name: 'Slow neck turns', area: 'neck', level: 2, pose: 'chinTuck', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['freely', 'everyday'],
    tip: 'Turn slowly to look over each shoulder.',
    why: 'Keeps your neck turning freely, the movement you need to check over your shoulder when driving or crossing a road.',
    steps: ['Sit tall with relaxed shoulders.', 'Turn your head to look over one shoulder.', 'Pause, then turn slowly to the other side.'],
  },
  {
    id: 'neck-roll', name: 'Half neck circles', area: 'neck', level: 1, pose: 'neck', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['stiffness', 'everyday'],
    tip: 'Roll your chin slowly from shoulder to shoulder.',
    why: 'Moves your neck gently through its range to ease stiffness after holding one position for a long time.',
    careful: "Keep the circle to the front half. Don't roll your head backwards.",
    steps: ['Sit or stand tall.', 'Drop your chin towards your chest.', 'Roll it slowly from one shoulder to the other.'],
  },
  {
    id: 'neck-levator', name: 'Diagonal neck stretch', area: 'neck', level: 1, pose: 'neck', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['stiffness', 'everyday'],
    tip: 'Nose towards your armpit. Let your hand rest on your head.',
    why: 'Targets the muscle behind the classic knot where your neck meets your shoulder blade.',
    steps: ['Sit tall and hold the edge of your seat with one hand.', 'Turn your head away from that hand and look down towards your other armpit.', 'Rest your free hand on your head, without pulling.'],
  },

  // Shoulders
  {
    id: 'sh-reach', name: 'Overhead reach', area: 'shoulders', level: 1, pose: 'reach', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['freely', 'flexibility', 'everyday'],
    tip: 'Reach both arms up and breathe into your sides.',
    why: 'Opens the sides of your body and the lats, which get short and tight when your arms spend all day in front of you.',
    steps: ['Stand tall, feet hip-width apart.', 'Reach both arms up overhead.', 'Breathe slowly and lengthen through your sides.'],
  },
  {
    id: 'sh-cross', name: 'Cross-body stretch', area: 'shoulders', level: 1, pose: 'armCross', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['flexibility', 'sport'],
    tip: 'Draw one arm across your chest.',
    why: 'Stretches the back of the shoulder, which tightens with carrying bags, desk work and lifting.',
    steps: ['Bring one arm across your chest.', 'Hold it gently with your other hand.', 'Keep your shoulders down and relaxed.'],
  },
  {
    id: 'sh-rolls', name: 'Shoulder rolls', area: 'shoulders', level: 1, pose: 'chinTuck', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['stiffness', 'everyday', 'freely'],
    tip: 'Lift, roll back and drop your shoulders. Go slowly.',
    why: 'Gets blood moving through the shoulders and resets shoulders that creep up towards your ears when you are stressed or focused.',
    steps: ['Stand or sit with your arms relaxed.', 'Lift your shoulders up to your ears.', 'Roll them back and down. Repeat slowly.'],
  },
  {
    id: 'sh-goalpost', name: 'Goalpost arms', area: 'shoulders', level: 2, pose: 'goalpost', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['sport', 'freely'],
    tip: 'Arms in a goalpost. Raise and lower them slowly.',
    why: 'Trains your shoulders to rotate outwards and opens the chest, balancing out hours of reaching forward.',
    steps: ['Lift your arms into a goalpost shape.', 'Slowly raise them overhead.', 'Lower back down, keeping the shape.'],
  },
  {
    id: 'sh-sidebend', name: 'Standing side bend', area: 'shoulders', level: 2, pose: 'sideBend', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['flexibility', 'stiffness'],
    tip: 'Reach up and over. Keep both feet grounded.',
    why: 'Lengthens the side of your body from hip to fingertips and helps your ribs move, so breathing feels easier.',
    steps: ['Stand tall and reach one arm up.', 'Lean gently to the opposite side.', 'Keep both feet grounded and breathe.'],
  },
  {
    id: 'sh-doorway', name: 'Doorway chest stretch', area: 'shoulders', level: 1, pose: 'doorway', seconds: 30, eachSide: true, equipment: 'wall',
    goals: ['everyday', 'stiffness', 'freely'],
    tip: 'Forearm on the door frame, elbow at shoulder height. Step through gently.',
    why: 'Opens the chest muscles that pull your shoulders forward after long hours at a desk, on a phone or driving.',
    careful: 'Keep the elbow at or below shoulder height, and ease off if you feel tingling down the arm.',
    steps: ['Stand in a doorway and rest one forearm on the frame, elbow at shoulder height.', 'Step forward with the same-side foot until you feel a stretch across your chest.', 'Keep your shoulder down, away from your ear, and breathe slowly.'],
  },

  // Upper back
  {
    id: 'ub-catcow', name: 'Cat–cow', area: 'upperBack', level: 1, pose: 'cat', seconds: 60, eachSide: false, equipment: 'mat',
    goals: ['stiffness', 'freely', 'everyday'],
    tip: 'Round your back, then let it dip. Move with your breath.',
    why: 'Moves your spine one section at a time, easing stiffness from sitting and warming your back up for everything else.',
    steps: ['Start on hands and knees.', 'Round your back up towards the ceiling.', 'Then let your belly dip. Move with your breath.'],
  },
  {
    id: 'ub-thread', name: 'Thread the needle', area: 'upperBack', level: 2, pose: 'thread', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['flexibility', 'sport'],
    tip: 'Slide one arm under and rest your shoulder down.',
    why: "Rotates the mid-back, the part of the spine built to twist, so your neck and lower back don't take the strain instead.",
    steps: ['Start on hands and knees.', 'Slide one arm under your body.', 'Rest your shoulder and the side of your head down.'],
  },
  {
    id: 'ub-twist', name: 'Seated twist', area: 'upperBack', level: 1, pose: 'twist', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['freely', 'stiffness'],
    tip: 'Sit tall and turn gently from your mid-back.',
    why: 'Restores rotation through the mid-back, which makes turning, reaching and sports like golf and tennis easier.',
    steps: ['Sit tall with one knee bent.', 'Hug the knee and turn towards it.', 'Keep lengthening as you turn.'],
  },
  {
    id: 'ub-hug', name: 'Self hug', area: 'upperBack', level: 1, pose: 'armCross', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['stiffness', 'everyday'],
    tip: 'Wrap your arms around you and round your upper back.',
    why: 'Stretches the muscles between your shoulder blades that ache after long spells hunched over a desk or phone.',
    steps: ['Stand or sit tall.', 'Cross your arms and hold your shoulder blades.', 'Round your upper back and breathe into it.'],
  },
  {
    id: 'ub-wall', name: 'Wall angels', area: 'upperBack', level: 2, pose: 'goalpost', seconds: 45, eachSide: false, equipment: 'wall',
    goals: ['everyday', 'sport'],
    tip: 'Back to the wall. Slide your arms up and down slowly.',
    why: 'Strengthens the upper back and opens the chest at the same time, the classic fix for rounded shoulders.',
    steps: ['Stand with your back against a wall.', 'Bring your arms into a goalpost against the wall.', 'Slide them up and down without arching.'],
  },
  {
    id: 'ub-puppy', name: 'Puppy stretch', area: 'upperBack', level: 1, pose: 'puppy', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['flexibility', 'stiffness', 'freely'],
    tip: 'Hips over knees, arms long. Let your chest melt towards the floor.',
    why: 'Opens the upper back and shoulders together, so reaching overhead gets easier and standing tall feels natural.',
    steps: ['Start on your hands and knees.', 'Walk your hands forward, keeping your hips above your knees.', 'Let your chest sink towards the floor and rest your forehead down.'],
  },
  {
    id: 'ub-lat', name: "Child's pose side reach", area: 'upperBack', level: 1, pose: 'child', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['flexibility', 'freely', 'stiffness'],
    tip: 'Walk both hands to one side and breathe into your ribs.',
    why: 'Stretches the lats, the big back muscles that limit reaching overhead and can tug on your lower back.',
    steps: ["Start in child's pose with your arms long in front of you.", 'Walk both hands over to one side until the other side of your body opens.', 'Sink your hips back and breathe into your ribs.'],
  },

  // Lower back
  {
    id: 'lb-child', name: "Child's pose", area: 'lowerBack', level: 1, pose: 'child', seconds: 60, eachSide: false, equipment: 'mat',
    goals: ['stiffness', 'everyday'],
    tip: 'Sit back on your heels, arms long. Breathe slowly.',
    why: 'Gently lengthens the lower back and hips while you breathe slowly, one of the calmest ways to ease a tight back.',
    steps: ['Kneel and sit back towards your heels.', 'Walk your hands forward, arms long.', 'Rest your forehead down and breathe slowly.'],
  },
  {
    id: 'lb-hug', name: 'Knee hug', area: 'lowerBack', level: 1, pose: 'hug', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['stiffness', 'everyday'],
    tip: 'On your back, hug both knees in and rock gently.',
    why: 'Takes the arch out of your lower back and gently stretches it, a soothing move when your back feels tight or tired.',
    steps: ['Lie on your back.', 'Hug both knees towards your chest.', 'Rock gently from side to side.'],
  },
  {
    id: 'lb-seated', name: 'Seated reach', area: 'lowerBack', level: 1, pose: 'seated', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['flexibility'],
    tip: 'Legs long. Reach forward from your hips.',
    why: 'Stretches the backs of the legs and the lower back together, so bending forward gets easier.',
    steps: ['Sit with your legs out in front.', 'Reach forward from your hips.', 'Keep your knees soft if you need to.'],
  },
  {
    id: 'lb-cobra', name: 'Cobra', area: 'lowerBack', level: 2, pose: 'cobra', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['flexibility', 'freely'],
    tip: 'Press up gently. Keep your hips on the floor.',
    why: 'Bends the spine backwards, the opposite of sitting, which often eases lower back stiffness after long days in a chair.',
    careful: 'Stop if pain spreads into a leg. Keep it gentle and pain-free.',
    steps: ['Lie on your front, hands under your shoulders.', 'Press up gently through your hands.', 'Keep your hips on the floor.'],
  },
  {
    id: 'lb-bridge', name: 'Glute bridge', area: 'lowerBack', level: 2, pose: 'bridge', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['sport', 'freely'],
    tip: 'Lift your hips, then lower slowly.',
    why: 'Wakes up the glutes, which support your lower back. Weak glutes are a common reason backs ache.',
    steps: ['Lie on your back, knees bent, feet flat.', 'Squeeze your glutes and lift your hips.', 'Lower slowly and repeat.'],
  },
  {
    id: 'lb-fold', name: 'Forward fold', area: 'lowerBack', level: 2, pose: 'fold', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['flexibility', 'sport'],
    tip: 'Soft knees. Let your upper body hang.',
    why: 'Lets gravity lengthen your hamstrings and lower back without any effort.',
    careful: 'Keep your knees soft, and roll up slowly to stand.',
    steps: ['Stand with your feet hip-width apart.', 'Fold forward from your hips, knees soft.', 'Let your head and arms hang.'],
  },
  {
    id: 'lb-sphinx', name: 'Sphinx', area: 'lowerBack', level: 1, pose: 'sphinx', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['stiffness', 'everyday'],
    tip: 'Rest on your forearms. Let your belly and hips stay heavy.',
    why: 'A gentle backbend that counters sitting. Many people with desk-related back stiffness find it eases quickly.',
    careful: 'Stop if pain spreads into a leg.',
    steps: ['Lie on your front with your elbows under your shoulders.', 'Press gently into your forearms to lift your chest.', 'Keep your hips and legs relaxed on the floor and breathe.'],
  },
  {
    id: 'lb-twist', name: 'Lying knee drops', area: 'lowerBack', level: 1, pose: 'supineTwist', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['stiffness', 'everyday', 'freely'],
    tip: 'Knees together. Let them fall to one side, shoulders heavy.',
    why: 'Gently rotates the lower back and stretches the outer hips, a soothing way to free up a back that feels locked.',
    steps: ['Lie on your back with your knees bent and feet flat, arms out wide.', 'Let both knees fall slowly to one side.', 'Keep both shoulders on the floor and breathe, then bring the knees back up.'],
  },
  {
    id: 'lb-birddog', name: 'Bird dog', area: 'lowerBack', level: 2, pose: 'birdDog', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['stiffness', 'sport', 'everyday'],
    tip: 'Reach the opposite arm and leg long. Keep your back still, like a table.',
    why: 'Trains your core to keep the spine steady while your arms and legs move, which is what protects your back day to day.',
    steps: ['Start on your hands and knees, hands under shoulders and knees under hips.', 'Reach one arm forward and the opposite leg back until both are level with your body.', 'Pause without letting your back sag or twist, then lower and switch slowly.'],
  },

  // Hips
  {
    id: 'hip-butterfly', name: 'Butterfly', area: 'hips', level: 1, pose: 'butterfly', seconds: 60, eachSide: false, equipment: 'mat',
    goals: ['flexibility', 'everyday'],
    tip: 'Soles together. Let your knees fall open.',
    why: 'Opens the inner thighs and hips, which tighten from sitting with your knees together.',
    steps: ['Sit tall and bring the soles of your feet together.', 'Let your knees fall open.', 'Lean forward slightly if it feels good.'],
  },
  {
    id: 'hip-lunge', name: 'Low lunge', area: 'hips', level: 1, pose: 'lunge', seconds: 45, eachSide: true, equipment: 'mat',
    goals: ['freely', 'sport', 'everyday'],
    tip: 'Back knee down. Ease your hips forward.',
    why: 'Stretches the hip flexors at the front of the hip. Sitting keeps them short, and tight hip flexors can pull on your lower back.',
    steps: ['Step one foot forward and lower your back knee.', 'Keep your chest tall, hands on your front knee.', 'Ease your hips forward until you feel a gentle stretch.'],
  },
  {
    id: 'hip-fig4', name: 'Figure-four stretch', area: 'hips', level: 1, pose: 'hug', seconds: 45, eachSide: true, equipment: 'mat',
    goals: ['flexibility', 'stiffness', 'everyday'],
    tip: 'Ankle over knee. Draw your legs in gently.',
    why: 'Stretches the glutes and deep hip rotators, often tight in people with back ache or tightness down the back of the leg.',
    steps: ['Lie on your back, knees bent.', 'Cross one ankle over the other knee.', 'Draw both legs towards you until you feel the hip.'],
  },
  {
    id: 'hip-swing', name: 'Leg swings', area: 'hips', level: 2, pose: 'legSwing', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['sport', 'freely'],
    tip: 'Hold on for balance and swing with control.',
    why: 'Takes your hips through their full range with control, a great warm-up before walking, running or the gym.',
    steps: ['Stand side-on to a wall and hold it.', 'Swing your outside leg forward and back.', 'Keep it smooth and controlled.'],
  },
  {
    id: 'hip-squat', name: 'Deep squat hold', area: 'hips', level: 2, pose: 'squat', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['sport', 'freely'],
    tip: 'Heels down, chest up. Hold on to something if needed.',
    why: 'Keeps the hip, knee and ankle mobility to get down to the floor and back up, a skill worth keeping for life.',
    careful: 'Hold on to something sturdy, and only go as low as is comfortable.',
    steps: ['Stand with your feet a little wider than your hips.', 'Sink down into a squat, heels down.', 'Keep your chest up and breathe.'],
  },
  {
    id: 'hip-pigeon', name: 'Pigeon', area: 'hips', level: 3, pose: 'pigeon', seconds: 45, eachSide: true, equipment: 'mat',
    goals: ['flexibility', 'sport'],
    tip: 'Front shin across, back leg long. Stay tall or fold.',
    why: 'A deep stretch for the outer hip and glutes that helps your hips rotate freely.',
    careful: 'Skip it if you feel it in your knee. The figure-four stretch does the same job more gently.',
    steps: ['Bring one shin forward across your mat.', 'Slide your other leg long behind you.', 'Stay tall, or fold forward over your shin.'],
  },
  {
    id: 'hip-sidelunge', name: 'Side lunge stretch', area: 'hips', level: 2, pose: 'sideLunge', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['flexibility', 'sport', 'freely'],
    tip: 'Sit back into one hip. Keep the other leg straight, toes up.',
    why: 'Opens the inner thighs, which are often tight and overlooked, especially in runners and people who sit a lot.',
    steps: ['Stand with your feet wide apart, toes pointing forward.', 'Bend one knee and sit your hips back over that leg.', 'Keep the other leg straight until you feel the inner thigh stretch.'],
  },
  {
    id: 'hip-wgs', name: "World's greatest stretch", area: 'hips', level: 2, pose: 'lungeReach', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['freely', 'sport', 'flexibility'],
    tip: 'From a long lunge, turn and reach your inside arm to the ceiling.',
    why: 'Opens the hips, hamstrings and mid-back in one flowing move, an efficient warm-up for your whole body.',
    steps: ['Step into a long lunge and put both hands on the floor inside your front foot.', 'Turn your chest towards your front knee and reach that arm up to the ceiling.', 'Follow your hand with your eyes, then lower it back down.'],
  },

  // Knees
  {
    id: 'kn-quad', name: 'Standing quad stretch', area: 'knees', level: 1, pose: 'quad', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['flexibility', 'everyday'],
    tip: 'Hold one foot behind you. Keep your knees together.',
    why: 'Stretches the front of the thigh. Tight quads pull on the kneecap and can make stairs and squats feel worse.',
    steps: ['Stand tall and hold a wall for balance.', 'Hold one foot behind you.', 'Keep your knees together and hips forward.'],
  },
  {
    id: 'kn-hamstring', name: 'Hamstring stretch', area: 'knees', level: 1, pose: 'seated', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['flexibility', 'everyday'],
    tip: 'One leg long. Hinge forward with a long back.',
    why: 'Lengthens the hamstrings, which lets you bend forward without straining your lower back.',
    steps: ['Sit with one leg long and the other bent.', 'Sit tall, then hinge forward from your hips.', 'Stop at a gentle stretch behind the knee.'],
  },
  {
    id: 'kn-lyingham', name: 'Lying hamstring stretch', area: 'knees', level: 1, pose: 'legRaise', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['flexibility', 'stiffness', 'sport'],
    tip: 'Lift one leg towards the ceiling. Hold behind the thigh, or use a towel.',
    why: 'Stretches the hamstrings while your back stays supported on the floor, much kinder to a sore back than bending forward.',
    steps: ['Lie on your back with both knees bent.', 'Straighten one leg up towards the ceiling, holding behind the thigh or with a towel around the foot.', 'Keep your lower back on the floor and only draw the leg in as far as is comfortable.'],
  },
  {
    id: 'kn-slides', name: 'Heel slides', area: 'knees', level: 1, pose: 'hug', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['stiffness', 'everyday', 'freely'],
    tip: 'Slide your heel in and out, nice and slow.',
    why: 'Gently bends and straightens the knee to keep it moving, especially useful when it feels stiff or after an injury.',
    steps: ['Lie on your back with your legs long.', 'Slide one heel towards you, bending the knee.', 'Slide it back out. Keep it smooth.'],
  },
  {
    id: 'kn-heelsit', name: 'Heel sit', area: 'knees', level: 2, pose: 'heelSit', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['freely', 'stiffness'],
    tip: 'Sit back towards your heels. Use a cushion if needed.',
    why: 'Restores deep knee bend, which you need for kneeling and getting up off the floor.',
    careful: 'Put a cushion between your heels and seat if your knees complain.',
    steps: ['Kneel with your knees together.', 'Sit back towards your heels.', 'Place a cushion behind your knees if needed.'],
  },
  {
    id: 'kn-couch', name: 'Couch stretch', area: 'knees', level: 3, pose: 'couch', seconds: 45, eachSide: true, equipment: 'wall',
    goals: ['sport', 'flexibility'],
    tip: 'Back shin up the wall. Squeeze your glute.',
    why: 'An intense stretch for the hip flexors and quads, the muscles sitting tightens most.',
    careful: "Pad your knee and ease in. It's strong, so start a little further from the wall.",
    steps: ['Kneel with your back shin up a sofa or wall.', 'Bring your other foot forward.', 'Lift your chest and squeeze your glute.'],
  },

  // Ankles
  {
    id: 'an-rock', name: 'Ankle rocks', area: 'ankles', level: 1, pose: 'ankleRock', seconds: 30, eachSide: true, equipment: 'mat',
    goals: ['freely', 'sport', 'everyday'],
    tip: 'Rock your front knee over your toes, heel down.',
    why: 'Lets your knee travel further over your toes, which helps with squats, stairs and walking downhill.',
    steps: ['Half kneel with one foot forward.', 'Rock your front knee forward over your toes.', 'Keep your front heel down.'],
  },
  {
    id: 'an-circles', name: 'Ankle circles', area: 'ankles', level: 1, pose: 'seated', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['stiffness', 'everyday'],
    tip: 'Draw slow, big circles with your toes.',
    why: 'Moves the ankle in every direction, keeping it supple and ready before you spend time on your feet.',
    steps: ['Sit with one leg out in front of you.', 'Draw big, slow circles with your foot.', 'Switch direction halfway.'],
  },
  {
    id: 'an-calf', name: 'Calf stretch', area: 'ankles', level: 1, pose: 'calf', seconds: 30, eachSide: true, equipment: 'wall',
    goals: ['flexibility', 'sport', 'everyday'],
    tip: 'Back leg straight, heel down. Lean into the wall.',
    why: 'Stretches the calf. Tight calves are linked to heel pain, Achilles trouble and stiff ankles.',
    steps: ['Face a wall with your hands on it.', 'Step one foot back, keeping the heel down.', 'Lean in until you feel the calf.'],
  },
  {
    id: 'an-dog', name: 'Down dog', area: 'ankles', level: 2, pose: 'downDog', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['flexibility', 'sport'],
    tip: 'Hips high. Gently press your heels towards the floor.',
    why: 'Stretches the calves, hamstrings and shoulders together while strengthening your arms.',
    steps: ['Start on hands and knees.', 'Lift your hips up and back.', 'Gently press your heels towards the floor.'],
  },
  {
    id: 'an-squat', name: 'Squat ankle shifts', area: 'ankles', level: 3, pose: 'squat', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['sport'],
    tip: 'In a deep squat, shift your weight slowly side to side.',
    why: 'Builds ankle and hip mobility under your own weight, for deeper and steadier squats.',
    steps: ['Sink into a deep squat.', 'Shift your weight onto one foot.', 'Then slowly shift to the other side.'],
  },

  // Elbows
  {
    id: 'el-circles', name: 'Arm circles', area: 'elbows', level: 1, pose: 'armsOut', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['freely', 'everyday', 'stiffness'],
    tip: 'Arms out wide. Draw slow circles, then change direction.',
    why: 'Warms up the shoulders and elbows by taking them through a full circle, a good start to any session.',
    steps: ['Stand tall with your arms out to the sides.', 'Draw slow circles, growing a little each time.', 'Halfway through, change direction.'],
  },
  {
    id: 'el-bend', name: 'Overhead triceps stretch', area: 'elbows', level: 1, pose: 'triceps', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['flexibility', 'everyday', 'sport'],
    tip: 'Hand down your back. Ease the elbow back with your other hand.',
    why: 'Stretches the back of the upper arm and under the shoulder, so reaching overhead feels easier.',
    steps: ['Reach one arm up, then bend the elbow so your hand drops behind your head.', 'Hold the elbow with your other hand.', 'Ease it gently back and keep your head tall.'],
  },
  {
    id: 'el-turn', name: 'Forearm turns', area: 'elbows', level: 1, pose: 'forearmTurn', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['freely', 'everyday', 'sport'],
    tip: 'Elbows at your sides. Turn your palms up, then down.',
    why: 'Keeps your forearms turning freely, the motion for turning keys, door handles and jar lids.',
    steps: ['Tuck your elbows in, forearms forward.', 'Turn your palms up as far as they go.', 'Turn them down. Keep the elbows still.'],
  },
  {
    id: 'el-wall', name: 'Wall bicep stretch', area: 'elbows', level: 2, pose: 'wallArm', seconds: 30, eachSide: true, equipment: 'wall',
    goals: ['flexibility', 'sport'],
    tip: 'Arm back on the wall, palm flat. Turn your chest away.',
    why: 'Stretches the biceps and the front of the shoulder, which tighten from carrying and pressing.',
    steps: ['Stand side-on to a wall.', 'Reach the near arm back and press your palm flat.', 'Turn your chest away until you feel the arm.'],
  },
  {
    id: 'el-extensor', name: 'Wrist extensor stretch', area: 'elbows', level: 1, pose: 'fingerPull', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['everyday', 'stiffness'],
    tip: 'Arm straight, palm down. Draw the back of your hand towards you.',
    why: 'Stretches the forearm muscles behind tennis elbow, which overwork with typing, using a mouse and gripping.',
    steps: ['Hold one arm out in front with the elbow straight and the palm facing down.', 'With your other hand, gently bend the wrist so your fingers point down.', 'Hold where you feel the stretch along the top of your forearm.'],
  },

  // Wrists
  {
    id: 'wr-circles', name: 'Wrist circles', area: 'wrists', level: 1, pose: 'wristCircle', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['stiffness', 'everyday', 'freely'],
    tip: 'Circle both wrists slowly, then change direction.',
    why: 'Moves your wrists in every direction to ease stiffness from typing and phone use.',
    steps: ['Arms out in front, hands relaxed.', 'Draw slow circles with your hands.', 'Halfway through, change direction.'],
  },
  {
    id: 'wr-prayer', name: 'Prayer stretch', area: 'wrists', level: 1, pose: 'prayer', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['flexibility', 'stiffness', 'everyday'],
    tip: 'Palms together at your chest. Lower your hands until you feel it.',
    why: 'Stretches the wrist and forearm muscles that work every time you type, grip or hold a phone.',
    steps: ['Press your palms together in front of your chest.', 'Keep them together and lower your hands.', 'Stop when you feel the stretch under your wrists.'],
  },
  {
    id: 'wr-pull', name: 'Wrist flexor stretch', area: 'wrists', level: 1, pose: 'fingerPull', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['flexibility', 'everyday'],
    tip: 'Arm out, palm up. Draw the fingers back gently.',
    why: "Stretches the forearm muscles you grip with, helping ease the tightness behind golfer's elbow.",
    steps: ['Reach one arm out in front, palm up.', 'With the other hand, draw the fingers back gently.', 'Keep the elbow soft and breathe.'],
  },
  {
    id: 'wr-table', name: 'Tabletop wrist rocks', area: 'wrists', level: 2, pose: 'tabletop', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['sport', 'freely'],
    tip: 'Hands flat on the floor. Rock gently forward and back.',
    why: 'Gets your wrists ready to take weight, for push-ups, yoga and getting up off the floor.',
    steps: ['Start on hands and knees, fingers spread.', 'Rock your weight forward over your wrists.', 'Rock back. Keep your palms flat.'],
  },
  {
    id: 'wr-reverse', name: 'Reverse prayer', area: 'wrists', level: 3, pose: 'reversePrayer', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['flexibility'],
    tip: 'Palms together behind your back. Slide them up slowly.',
    why: 'A deeper stretch for the wrists and the front of the shoulders at the same time.',
    careful: 'Skip it if your shoulders or wrists pinch. The prayer stretch does the same job more gently.',
    steps: ['Bring your palms together behind your back, fingers down.', 'Turn the fingers up if you can.', 'Slide the hands up your back and hold.'],
  },

  // Feet
  {
    id: 'ft-spread', name: 'Toe spreads', area: 'feet', level: 1, pose: 'footFlex', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['everyday', 'freely'],
    tip: 'Spread your toes wide, hold, then relax.',
    why: 'Wakes up the small muscles inside your feet that hold up your arches and help your balance.',
    steps: ['Sit with your legs out, feet relaxed.', 'Spread your toes as wide as they go.', 'Hold for a breath, then relax them.'],
  },
  {
    id: 'ft-flex', name: 'Foot flex and point', area: 'feet', level: 1, pose: 'footFlex', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['stiffness', 'everyday'],
    tip: 'Pull your toes towards you, then point them away.',
    why: 'Moves the ankles and stretches the shins and calves, easing feet that feel stiff from shoes.',
    steps: ['Sit with one leg out in front.', 'Pull the toes back towards you.', 'Point them away. Keep it slow.'],
  },
  {
    id: 'ft-raise', name: 'Heel raises', area: 'feet', level: 1, pose: 'calfRaise', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['sport', 'everyday', 'freely'],
    tip: 'Rise onto your toes, pause, lower slowly.',
    why: 'Strengthens your calves and feet for walking, balance and stairs.',
    steps: ['Stand with feet hip-width apart.', 'Rise up onto your toes and pause.', 'Lower slowly. Hold on to something if needed.'],
  },
  {
    id: 'ft-toes', name: 'Toe stretch kneel', area: 'feet', level: 2, pose: 'heelSit', seconds: 45, eachSide: false, equipment: 'mat',
    goals: ['flexibility', 'stiffness'],
    tip: 'Kneel with your toes tucked under. Sit back gently.',
    why: 'Stretches the soles of your feet and your toes, which stiffen in shoes and are linked to foot pain.',
    steps: ['Kneel with your toes tucked under.', 'Sit back towards your heels.', 'Ease off if it is too much.'],
  },
  {
    id: 'ft-arch', name: 'Arch lifts', area: 'feet', level: 2, pose: 'calfRaise', seconds: 45, eachSide: false, equipment: 'none',
    goals: ['sport', 'freely'],
    tip: 'Feet flat. Lift your arches without curling your toes.',
    why: 'Strengthens your arches, which can help with flat feet and tired feet.',
    steps: ['Stand with feet flat and toes relaxed.', 'Draw the ball of the foot towards the heel to lift the arch.', 'Hold, then relax. Keep the toes long.'],
  },
  {
    id: 'ft-plantar', name: 'Plantar fascia stretch', area: 'feet', level: 1, pose: 'footFlex', seconds: 30, eachSide: true, equipment: 'none',
    goals: ['everyday', 'stiffness'],
    tip: 'Pull your toes back towards your shin. Feel it under your arch.',
    why: 'Stretches the band under your foot that is linked to heel pain, especially helpful first thing in the morning.',
    steps: ['Sit and cross one foot over the opposite knee.', 'Hold your toes and gently pull them back towards your shin.', 'Feel the stretch along the sole of your foot and hold.'],
  },
];


const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}

export function exercisesForArea(area: AreaId): Exercise[] {
  return EXERCISES.filter((e) => e.area === area).sort((a, b) => a.level - b.level);
}

/** Total seconds a move takes (both sides when needed). */
export function moveSeconds(e: Exercise): number {
  return e.seconds * (e.eachSide ? 2 : 1);
}

export function durationLabel(e: Exercise): string {
  return e.eachSide ? `${e.seconds}s each side` : `${e.seconds}s`;
}

export const EQUIPMENT_LABEL: Record<Exercise['equipment'], string> = {
  none: 'No equipment',
  mat: 'Mat',
  wall: 'Wall',
};
