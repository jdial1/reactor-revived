# The Soul Interview: Reactor Revived

A question set for finding what this game is *about*, and turning it into rules
the build has to follow. It is the general Soul Interview adapted to this repo:
every question is asked about Harrow Station, the operator and the valley, and
every answer has a place in the build to go.

## Why this game needs it

The machine is specified to the last point of heat. [soul.md](soul.md) and the
soul instance (`game-souls/instances/reactor_revived.txt`) say what the reactor
does, what it must never do, and how every feature is checked. What they do not
say is **why anyone is here**. That covers the atmosphere, the operator's reason
for turning the key, the town, and the world outside the 12 x 8. When a
requirement is silent, the build falls back to the average nuclear game: a
green glow, a hazard trefoil, a klaxon, a wasteland, a wink at Chernobyl. None
of those is in the game yet. This interview is how to keep it that way on
purpose rather than by luck.

What is on record today is thin and specific, which is a good start:

- **The operator's log** (`www/js/objectives.js`): thirty jobs, each with one
  line. *"Day one. Harrow Station has sat cold for eleven years. The key still
  turns."* ... *"The valley has power. Keep it that way."*
- **The trophies** (`www/js/records.js`): named flatly. *A Very Expensive Fan.
  Ancestor Worship. Paperwork.*
- **A handful of voiced strings:** *"It is already cold."* after ten taps on a
  cold heat bar; the meltdown sheet, *"Heat passed twice what the reactor could
  hold. Every part in it was destroyed."*
- **The materials:** a steel UI cut from Buch's frames, heavy dull impacts, one
  hum, fuel glows in their own colours, a money odometer on drums.

### The frame the answers live inside

These are the game's standing rules ([soul.md](soul.md), "Standing rules"). An
answer may challenge one, and question 6.3 asks it to, but changing one means
returning to Phase 2 of the soul instance and writing a ledger entry.

- **No story beats.** The universe never arrives as a scene, a cutscene or a
  character on screen. It reaches the player only through the log's one line
  per job, names, the voice of system text, the materials, and the sound.
- **Comedy is deadpan only.**
- **A meltdown is an absolute clean wipe.** A receipt is words, not wreckage.
- **Immersion is rated Low.** The machine is the point. The world is there to
  give the machine somewhere to be and someone to be for, as an IC2 player's
  base did.
- **Stay inside the lineage.**

So the aim is not more lore. It is fewer, truer words that point at a larger
world, so that every line, sound and colour comes from the same place.

## How to run it

- **The designer answers; the interviewer never does.** Offering options
  anchors the answer to the average. If the designer is completely stuck,
  offer one example, and make it strange.
- **One phase per sitting.** Answers improve overnight.
- **Always ask the push.** The first answer is usually a cliche; the second or
  third is usually true.
- **Read "On record" only after the first answer.** It is what the repo says
  today, so push against it. It is not the answer. Whoever drafted a line, it is
  only a first answer: keep it if the push turns up nothing truer, and replace
  it if the push does.
- **Record exact words** under each question. The designer's phrasing often is
  the tone. Don't clean it up.
- **Red flags for this game.** Any answer that could describe 500 other games,
  and in particular:
  - the library's own terms offered as feelings: "watchful calm", "Mark I",
    "the square law"
  - nuclear shorthand: "Chernobyl", "Fallout", "atompunk", "retro-futurist",
    "glowing", "radioactive", "post-apocalyptic"
  - idle-game shorthand: "satisfying", "chill", "number go up", "cozy"

---

## Phase 0: The Spark

**0.1** What was the exact moment you first wanted to make *this* game, not
rewrite Knockoff but make Reactor Revived? Where were you, and what were you
looking at?
*Push:* "Not the constraint, not the lineage. The moment."
*On record:* the README's "Why it exists" is about craft (a 2013 browser game
with no build step, "that constraint *is* the aesthetic"). It says why the code
looks like this, not why the game exists.
> Answer: "it is a rewrite and revival of that game, that game was my childhood
> or middle school and it died, no one carried on the torch like the last 6
> games, so I need to"
>
> The moment: "I was in college looking for it, and there a knockoff on github
> last update 5 years ago..."
>
> What it made them want: "I wanted to carry the torch bring back the glory of
> the game to a modern mobile device"

**0.2** Which game in the line (IC2 in a Minecraft base, the planner, Reactor
Incremental, Knockoff) made you think "I want to feel that again, but
different"? What was the different?
*Push:* "What did that game get wrong, or leave out? Not a bug; the README has
the bugs. The feeling."
*On record:* the README's "From the players" lists what players asked for. It
does not say what *you* missed.
> Answer: "Reactor Incremental is the game of my childhood,"
>
> The different: "it felt limited built for a dated tech stack , flash player on
> a web browser, very sensitive UI (a wrong click is fully game over) , it had a
> very easy entry but very high total understanding cap"
>
> The moment it clicked: "looking up online layouts there was a layer of insider
> understanding after playing for a while, reading between the lines matrix
> style, the part interactions, the art dance as a reactor processes and churns
> through the logic you have built out in the reactor"
>
> *For 6.3:* that insider layer came from layouts found outside the game. The
> build now ships layouts inside it (examples, codes, the planner). Does that
> feed the insider layer, or spend it?

**0.3** If one person could play this once, who would it be, and what would you
want them to feel when they lock the phone?
*Push:* "Describe their face. Where are they sitting?"
> Answer: "I want the game for me, an audience of 1, I want it to not only be a
> lineage but an actual upgrade, improved on the recipe of old, carrying the
> torch while adjusting/refining the model just enough to feel more"
>
> Their face: "I would be looking in concentration reviewing the parts,
> interactions, reactor flow, etc"
>
> More of what: "more of the struggle, the pain, 'sucking is the first step to
> being awesome', the feel of acomplishment"
>
> *For 1.1, 1.2 and 6.3:* the soul docs end a good session by looking away
> (Containment: "A good design is one you can stop watching"; the instance:
> "good enough to put in your pocket"). This answer ends it by looking closer,
> in concentration. And the build has spent a lot of work taking pain out
> (free refunds, no gesture that destroys, the planner's forecast, example
> layouts), where this answer asks for more of the struggle. Which of those is
> the game?

**0.4** What is the part you are a little embarrassed by: too personal or too
strange to say out loud? It may be about reactors, about the town, about a
phone, or about you.
*Push:* none. Protect whatever comes out; it is usually the soul.
> Answer: "the part set needs a complete rebuild instead of a pixel enhance and
> scaling, but it is impossible no asset pack exists and LLM prompts fail to
> match what is needed"
>
> What they get wrong: "the original is very low 16x16 pixel art but still
> dense and intentional, LLM prompts give 128x128 icons over greebled or asset
> packs are 3d instead of 2d and are generic factory parts and not needed parts"
>
> *For 5.2 and 7.6:* the first line of the art spec. The build today ships
> Reactor Revival's 128x128 sprites stored at 64px and 32 colours, and draws a
> dock part at 31px.

## Phase 1: The Feeling

**1.1** Name the one feeling the game exists to produce. Not "fun", and not the
library's word for it.
*Push:* "Calm how? What is the player's hand doing while they feel it?"
*On record:* the soul calls it Watchful Calm: "a dangerous machine, quiet
because it was built right." That is the library's name. What is yours?
> Answer: "A feeling of accomplishment pulled from confusing and uncertainty"
>
> The turn: "The game replicates the struggle of programming
>
> A junior dev might look at code in pure confusion but a master sees the
> structure
>
> Accomplishment from turning the reactor on and watching it a flow together"
>
> *For 4.3 and the Lock:* the build has no switch to turn the reactor on. A
> part works from the tick it is placed; the nearest things to "on" are
> unpausing, and Build in the planner putting a design onto the real board.
>
> Their reply: "Pause/un pause is the on switch"

**1.2** Name a second feeling that fights the first.
*Push:* "Is that the fight you feel, or is there another one underneath it?"
*On record:* Containment's fight is calm against danger ("the danger never
leaves the room"). The log hints at others it has never named: a town that
depends on you ("If the station trips, all of them go dark"), and a university
that has stopped saying what the particles are for.
> Answer: "Understanding which can be hard and not fun"
>
> When: "Linking cells to exchangers to coolant tanks , to vents and seem the
> heat flow, the process working"
>
> Where it stopped being fun: "Each time the link failed and reactor exploded"
>
> *For 6.3:* the build already softens exactly this. The planner runs a chain
> for free and names the tick it would fail, Flow shows each tile's heat, and
> the log hands over worked chains (the exchanger chain at goal 16, the heat
> pipe at goal 18) with broken copies to mend. Which of the explosions are the
> struggle this game wants more of, and which are the not-fun kind?

**1.3** What should the player feel in the first sixty seconds, the first hour,
and the last hour? And what does the operator feel at those three points?
*Push:* "What changes between those three?"
*On record:* the first line of the log is *"Day one ... The key still turns."*
The first hour is selling and venting by hand. The last line is *"The valley has
power. Keep it that way."* After it, the game goes on with no list.
> Answer: "First 60 sec should be intrigue, light understanding,
>
> First hour, getting into middle tier parts , full reactor grids with plenty
> of upgrades, the understanding good and tight
>
> Last hour , feeling of completeness/ satisfaction with the state of
> completing all content"
>
> What changes: "First 60 secs you are busy working through very minor layouts
>
> First hour you have unlocked a lot more parts and the expectations of a
> layout are much more"
>
> What makes the last hour complete: "Maxed out all parts and upgrades, a full
> reactor, no more goal/objectives"
>
> *On record:* that state exists but is never named. All 72 upgrades have a
> ceiling (1,382 levels in all; most stop at 32), every part unlocks, and the
> log ends. Nothing in the game says when all three are true. A reboot clears
> the 44 cash upgrades and keeps the 28 bought with particles, so a maxed board
> is also something the player can choose to give up.
>
> *For 6.3, and the Structure axis:* "completing all content" has no state in
> the build. The log's last job is "Nothing left on the list" (and a trophy of
> the same name), then a reboot is offered and the game goes on: records,
> restriction runs, trophies. Containment is a Rebirth Account, and the
> instance never ends. Also: how long goals 1-18 take has never been measured
> (P1 item 8 in mvp-1.0.md), so whether the first hour reaches middle-tier
> parts and a full grid ("Fill every tile" is goal 18) is not known.

**1.4** What moment would a player tell a friend about? Say it the way they
would say it.
*Push:* "With excitement, or quietly? Would they send the layout code, or a
screenshot, or neither?"
*On record:* the Seed Card in the soul instance guesses: *"The vent upgrade made
my checkerboard wasteful, so I rebuilt it round exchangers, and it has been
Mark I for four thousand ticks."* It was inferred from the build and is
unconfirmed. Replace it if yours is truer.
> Answer: "The puzzle solving , intricate part interactions and endless design
> layouts"
>
> *For 6.3:* "endless design layouts" here, and "completing all content" in the
> last hour (1.3). Both can be true; the Lock decides how.
>
> As they would tell it: "They would be excited to say they figured out the
> accelerator layout"
>
> *On record, and for 6.3:* the accelerator layout is the one Knockoff never let
> anyone figure out (its first accelerator could never make a particle). Here
> the log hands it over: at goal 22, "Feeding an accelerator" opens as an
> example, one dual seaborgium cell between two accelerators, with its rule
> spelled out. The moment players would be excited to tell is the one the game
> currently gives away. This answer also replaces the Seed Card's inferred
> next-day story (the checkerboard rebuilt round exchangers).

**1.5** What must this game never make anyone feel?
*Push:* "Name one the soul docs don't already name."
*On record:* never congratulated for a number; never punished for being away;
comedy never louder than deadpan.
> Answer (goes on the Never List): "Boredom or complete frustration, having to
> leave the app to search for help, having no alternative layouts or options so
> the game becomes completely repetitive"
>
> *On record:* two of these already have names in the library.
> "Leave the app to search for help" is pitfalls/outside_tool.txt, and the
> instance's Workbench row ("if players would need an outside tool to design
> well, does the game ship it?"). "No alternative layouts" is
> pitfalls/checkerboard_forever.txt, already on the instance's watchlist.
>
> *For 6.3:* in 0.2 the insider layer came from "looking up online layouts". Here,
> leaving the app to search for help is a thing to never feel.
>
> The line between the pain wanted and the frustration banned: "Frustration is
> failing with no idea why, the struggle is the slow climb of knowledge"
>
> *On record:* this is components/legible_failure.txt, a Core component of the
> instance: every failure names its cause. The build's answers are the heat bar
> on every tile, Flow, the shift log's first-out line, and the meltdown receipt
> (the first part lost and what it held). It also sorts the explosions in 1.2:
> one the player can explain is the struggle; one they can't is the
> frustration.

## Phase 2: The World's Truths

**2.1** What is one thing true in Harrow's world that isn't true in ours?
*Push:* "What does that change about an ordinary Tuesday in town?" The log
already has one: *"Thorium arrives on Tuesday."*
*On record:* nothing yet. The physics (conserved heat, touching cells) is ours,
nearly. The fuels are not: dolorium, nefastium, protium.
> Answer: "Progress is infinite , resources are infinite, meltdown is a finite
> event with no long term world repercussions"
>
> *For 6.3:* "progress is infinite" beside the finite, maxed-out last hour of
> 1.3; "resources are infinite" beside Containment's scarcity, where the 96
> tiles are the one thing that never grows. "No long term world repercussions"
> is the standing rule that a meltdown is a clean wipe, now said as a law of the
> world, and it bears on 4.4 and the log's "If the station trips, all of them go
> dark."
>
> On an ordinary day: "Resources scale to infinite like most upgrades, resources
> can be depleted by buying parts/upgrades but scaling is infinite
>
> An operator sees an ever growing demand and an ever growing complexity of
> options to handle that demand"
>
> *For 7.3:* demand grows through the log (the mill's second shift, the clinic
> overnight, the rail yard, the next valley, three towns) and stops at job 30:
> "The valley has power." In the mechanics demand never appears: power sells in
> any amount, and only the goals set a number to reach. The complexity half has
> mechanics: each part appears once ten of the one before it are placed,
> families arrive with the log, and a doctrine set opens every five goals.

**2.2** What does that truth cost, and who pays? Not in money.
*Push:* "Power without cost is hollow. Who in the valley pays for the plant
running?"
*On record:* *"Three towns are on this grid now. If the station trips, all of
them go dark."* *"Nefastium. The supplier made you sign twice."*
> Answer: "Power is the cost, meltdowns if you push too far
>
> Complexity comes risk and instability"
>
> *On record:* this is the lineage's oldest rule, kept in every game since IC2:
> power grows linearly with a cell's neighbours and heat with their square, so
> the more a board makes, the closer it runs to melting. A meltdown wipes the
> board and keeps money, research and records.
>
> Is it enough: "Losing the board is enough, rebuilding is the cost"
>
> *For 6.3:* outside Hardcore, rebuilding can be one tap. A layout code, a
> saved layout from the log, or the planner's Build puts the whole board back
> onto the empty grid, and the money to pay for it survived the meltdown. Only
> Hardcore takes those away.
>
> Their reply: "The ability to create and load a plan requires enough knowledge
> that it is pretty restricted for new users"
>
> *On record:* nothing locks it. The Plan button is in the header from the first
> minute of a new game (`www/js/ui.js`), hidden only in a Hardcore run; what
> restricts it is knowing what to put in it.

**2.3** Why did Harrow Station close eleven years ago? What happened that
everyone in the valley still feels?
*Push:* "How do people in town talk about it, or avoid talking about it?"
*On record:* nothing. The log never says why it closed. Decide also whether the
answer is ever said (7.7). Under "no story beats" it may never be; it can still
shape every line.
> Answer: "Unknown"
>
> For now, or on purpose: "Unknown on purpose"
>
> *Goes to 7.7* as a sacred mystery: why Harrow Station closed is never
> answered, by the game or the team. (Changed in 2.6: answered as the player
> climbs.)

**2.4** What does the valley believe that is wrong: about the plant, the
operator, the university, or the fuel?
*Push:* "Who believes it most, and what would they lose if it stopped being
true?"
> Answer: "The power demands real use could be a mystery, why the town need so
> much power urgently"
>
> *For 2.6 and 7.7:* a mystery candidate that ties the ever-growing demand of 2.1
> to the log's own open line about the particles ("They have stopped saying
> what for").
>
> Wrong belief, or open question: "Wrong belief that starts falling about as
> demands continue growing to absurd levels where the requests start fairly
> mundane but the need becomes so high and urgent, they give up trying to lie"
>
> *On record:* the log already walks part of this arc without saying so. The
> early jobs are mundane (the mill's second shift, the clinic's lights, the
> rail yard), the late ones stop explaining ("They have stopped saying what
> for", "The supplier made you sign twice", "came without a manual"). It is
> told in the one line per job the standing rules allow. *For 7.3:* past job 30
> the demand has no line and no number.

**2.5** What is scarce in the valley, and what is abundant that shouldn't be?
*Push:* "At job 30, what is scarce then?"
*On record:* the fiction runs from scarcity to abundance, from *"on candles"* to
*"Nobody in town remembers the candles now."* The mechanics keep ninety-six
tiles scarce forever while money inflates. The two curves have never been set
side by side.
> Answer: "Operators are scarce with enough knowledge to run the reactor
>
> Nodes/stations/towns that need more power are everywhere"
>
> *On record:* the operator works alone. Nobody else appears at the plant, and
> the log's early lines say so ("Nobody can stand at the valve all night",
> "Swapping spent cells by hand at 3 a.m. is how people get hurt"). Knowledge as
> the scarce thing is the understanding cap of 0.2 and the junior and master of
> 1.1, now said as a law of the world.
>
> Why operators are scarce: "Mystery and why the plant never came back online
> until now as the search found no one able to start it"
>
> *Goes to 7.7:* why knowledgeable operators are scarce is a mystery. That the
> plant stayed cold because a search found nobody able to start it is a truth;
> the designer places it (known or hidden) at the Lock.

**2.6** Which question about this world should never be fully answered?
*Push:* "Would the game be smaller if it were answered? Say how."
*On record:* the log already leaves three open. *"They have stopped saying what
for."* *"The supplier made you sign twice."* *"The last crate from the lab came
without a manual."* Which of these are mysteries on purpose, and which are just
unfinished?
> Answer: "All mysteries can be answered in due time"
>
> *For 6.3:* in 2.3 why the plant closed was "Unknown on purpose", and in 2.5
> why operators are scarce was a mystery.
>
> In due time means: "The game answers them eventually, as the player climbs"
>
> The two placed earlier too: "Answered as the player climbs, all of them"
>
> *On record, for 7.3 and 7.7:* the only place the game can answer anything
> under "no story beats" is the log's one line per job, and the log ends at job
> 30. docs/soul-brainstorm.md already holds an unbuilt idea for more room, E6
> "A second log": dry job lines at later tiers, one line per job, no story.

**2.7** If Harrow Station could speak, what would it complain about?
*Push:* "Not about the player. About its life."
*On record:* *"The old heat gauge sticks."* *"The plant clock runs slow."*
> Answer: "It's crumbling structure, outdated hardware, failing pipes, it's
> poorly maintained infrastructure"
>
> *For 6.3 and 7.3:* Containment's tone killer is "a part that fails for a
> reason the design did not cause", and it is on the instance's banned list. So
> failing pipes can never become random failures. The log's two complaints on
> record show a way that stays inside the rule: the sticking gauge is the manual
> venting of goal 2, and the slow clock is the Improved Chronometers of goal 11.
> Each is a complaint the player fixes with something they do or buy.

## Phase 3: People and Voice

**3.1** Describe one ordinary person in the valley: their job, their small
worry, their small joy.
*Push:* "Not the foreman or the physicists. Someone the log never mentions."
*On record:* the log's people are institutions: the mill, the clinic, the rail
yard, the co-op, the bank, the university, the supplier, an inspector, "the
foreman". Nobody has a name. Under "no story beats" this person may never
appear. They are here to decide who the log is written *for*.
> Answer: at the designer's request the interviewer offered five examples
> (strange ones, as the guide allows when someone is stuck). The designer chose
> three: "3,4,5 are all good"
>
> 3. The man who winds the town clock. It runs slow, like the plant's. Worry:
>    the two clocks have never agreed. Joy: the day they do.
> 4. The clinic's night nurse, who measures power by how many machines she can
>    run at once. Worry: a trip at 3 a.m. Joy: the first night she didn't need
>    the torch.
> 5. The courier who carries the university's letters to the plant. Worry: the
>    letters are getting shorter. Joy: she has started reading them.
>
> *Provenance:* these are the interviewer's words, chosen by the designer, not
> the designer's own. Treat them as weaker than an answer given unprompted.
>
> Made theirs: "3, as part of the mystery could be the lack of actual humans
> where every job is ran by humanoid robots.
>
> 5 is also good as the reading of letters sounds like a human selfish
> emotional action that might imply they are actually human"
>
> *On record:* nothing in the build names a person, human or not. The log's
> people are institutions (the mill, the clinic, the co-op, the university), and
> the operator is only "you". *For 7.7:* this joins the mysteries answered as
> the player climbs.
>
> True, or suspected: "Suspected, the player slowly finds out"
>
> How it connects: "They're the reason the search found nobody, robots are too
> specialized for tasks and require the approval of higher human leaders for
> reactor roles, which those humans no longer exist so the wait time for
> approval is infinite"
>
> *For 4.1:* if every reactor role waits on an approval that can never come,
> the operator is the one who started the plant without it. What the operator
> is, and how they got the key, is Phase 4's question.

**3.2** What do operators say at shift change? When a part fails? When the
board goes quiet?
*Push:* "Idioms carry more world than lore. Where would the player see one: a
log line, a trophy name, the floor line, an error?"
*On record:* the floor line reads like a plant-gate sign, *"Mark I · 4,210
ticks without incident"*. "Incident" is the only plant word the game uses.
> Answer: "The operator expects everything is normal, people say hello, good
> evening.
>
> Robots actually connect with local radios and link task lists without
> complaints or compliments"
>
> *On record:* the operator's log is already a task list, exactly that way. The
> README calls the goals "a checklist from one place", each item "the job, what
> it pays, and a one-line note", and the notes give orders without praise ("Put
> a vent on it." "Automate it."). No string in the game compliments the player
> (interface_voice: never congratulate a number).

**3.3** Who owns Harrow Station, who sent the operator, and what are they
afraid of?
*Push:* "What would they do to stop that fear coming true?"
*On record:* money comes from the town ("The town's first payment cleared"),
experiments from the university, and fuel from a supplier. Nobody is named as
owner.
> Answer:

**3.4** Who writes the operator's log? The game already has a narrator in the
log, the trophies, the tooltips and the errors. What kind of person is it?
*Push:* "Two or three words, and one *but*: tired, dry, kind ... but never
what?"
*On record:* the log speaks in short imperatives with no warmth added ("Put a
vent on it." "Automate it."). The trophies are flat. One line is almost a joke:
*"It is already cold."*
> Answer:

**3.5** Write one line exactly as the game should say it.
*Push:* "Now write the line the game should show when a part fails at three in
the morning and nobody is watching."
> Answer (becomes the voice reference):

**3.6** What phrase or tone would this game never use?
*Push:* "Which string in the build today comes closest to breaking it?" (See
the list in 7.5.)
*On record:* no exclamation marks anywhere in the interface; no praise; red kept
for danger and loss.
> Answer (goes on the Never List):

## Phase 4: The Player's Place

**4.1** Who is the player: hired, returning, inheriting, or something else? Does
the valley notice them?
*Push:* "Why did the key still turn? Who kept it?"
*On record:* the player is "you" in the log, from *"Day one"* onward. Nothing
says how they came to hold the key.
> Answer:

**4.2** What does the operator want, and what does the valley want from them?
Are those the same?
*Push:* "Where do they pull apart? A mismatch is story without cutscenes."
*On record:* the player chases marks, records and the perfect board; the town
wants the lights on; the university wants particles, and the reboot it asks for
shuts the plant down.
> Answer:

**4.3** For each verb (**place**, **inspect then sell, move or replace**,
**buy**), what does doing it mean inside the fiction?
*Push:* "Placing a part in a plant cold for eleven years is not the same as
placing one in a new build. Which is this?"
> Answer:

**4.4** What does a meltdown mean in the valley? Not the dialog: what actually
happens out there?
*Push:* "The standing rule forbids wreckage. Does it forbid a line?"
*On record:* the sheet says what happened to the reactor and nothing about the
towns on its grid. *"Restart the reactor."* The next job waits as if nothing
happened.
> Answer:

**4.5** What does the operator lose that they can't get back?
*Push:* "Permanence, even small. Mechanically almost nothing is lost: money and
research survive a meltdown. Is that true in the fiction too?"
*On record:* a meltdown count in Records, and the trophy *Short Fuse*.
> Answer:

**4.6** How is the operator different at the end, and how is the valley
different?
*Push:* "If neither changes, the thirty jobs were decoration."
*On record:* *"Nobody in town remembers the candles now."* The operator's change
is not written anywhere.
> Answer:

## Phase 5: Texture

**5.1** What does the control room smell like? What is the weather doing
outside?
*Push:* "Which season is the game set in, if the log says 'Winter is coming' at
job 13?"
> Answer:

**5.2** What is the plant made of? What does the operator touch?
*Push:* "Name a material in the build today that is wrong."
*On record:* steel frames with bevels (Buch's, recoloured to a steel ramp), a
checker grain on every face, a recessed odometer slot, part sprites with a
steel body and a black outline.
> Answer (becomes the material palette):

**5.3** What is the light like: time of day, colour temperature, where shadows
fall?
*Push:* "Is the operator working days or nights?"
*On record:* a board that warms toward red with heat, tile bars that stay grey
until four-fifths full, each fuel glowing in its own colour.
> Answer:

**5.4** What is the quietest sound in the game, and why does it matter?
*Push:* "What is quieter than the hum at Mark I?"
*On record:* the hum murmurs at 0.75x speed when cold and settles lower once
Mark I is earned; all impact sounds duck by up to 60% near the limit.
> Answer:

**5.5** What does a button press feel like here, and what in the plant does it
stand for?
*Push:* "Which press in the build today feels most like an app and least like
a plant?"
*On record:* six impacts, chosen for being heavy and dull; a placed part settles
with a small heavy drop; money rolls on drums.
> Answer:

**5.6** Name three real images or places that are this world's look.
*Push:* "A photo you could send. Not a game, not a film, not Chernobyl."
> Answer:

## Phase 6: Tensions and Taboos

**6.1** What would a player expect from a nuclear game, or an idle game, that
this one should refuse, on the atmosphere side?
*Push:* "The mechanical refusals are already written (the soul instance's
banned list). Name an image, a sound or a word."
> Answer (goes on the Never List):

**6.2** The fair-play contract already refuses daily rewards, ads, a battle
pass and notifications. Which one would hurt the *valley* most if it arrived,
and why?
*Push:* "The answer says what the town values."
> Answer:

**6.3** Which answers contradict each other, or contradict a standing rule?
Keep each contradiction, or resolve it? The known ones:
- A universe worth interviewing for, and **no story beats**.
- A meltdown as a **clean wipe**, and three towns that go dark if the station
  trips.
- **Immersion rated Low**, and this interview.
- The university's reboot, and a town that needs the lights on.

*Push:* "Some contradictions are the soul, and some are confusion. Which is
each?"
> Answer (any changed standing rule is ledgered in the soul instance):

**6.4** If you cut 80% of the atmosphere, which 20% keeps it recognisably
Harrow? Which lines, sounds and colours?
*Push:* "Would you keep the town, or only the plant?"
> Answer:

**6.5** Picture a stranger's reactor idle game with all ninety parts, the
planner and the marks, and none of the heart. What exactly is missing from it?
*Push:* "Which of those missing things is missing from this build too?"
> Answer (lists what the Lock must protect):

---

## Phase 7: Lock

This phase turns the answers into artifacts that constrain the build. Each
artifact says where it lives, so the answers reach the game and not just this
file.

### 7.1 The Soul Sentence

At most 25 words, holding the world's truth (Phase 2), the feeling (1.1), and
the fight (1.2).

**Test:** could it describe IC2, Reactor Incremental or Knockoff? If yes,
rewrite it.

Today there are two sentences, and neither holds a world truth:
- Containment: *"A good design is one you can stop watching."* This belongs to
  the whole family.
- The soul instance's philosophy: *"A reactor small enough to hold in one hand,
  and good enough to put in your pocket."* It was written from the build, not
  by the designer.

**Where it goes:** it replaces the instance philosophy in the soul instance's
Soul Choice. Containment stays as it is.

> Soul sentence:

### 7.2 Pillars

The machine already has its pillars: Containment's four, and the instance's two
house rules. An instance allows at most three house rules, so **the atmosphere
gets one pillar in the instance**. Anything more is carried by the Never List
and the Voice Guide instead. Each pillar needs all four parts, or it is a
slogan.

| Pillar | This means... | This forbids... | Test for any feature, line or asset |
| --- | --- | --- | --- |
| | | | |

### 7.3 World Laws to Mechanics

Every truth from Phase 2 shows up as a system, or is marked flavour-only on
purpose. **No log line, trophy name or field note ships without a row here.**

The log's existing lines, audited. The last column is the designer's call.

| Line on record | How the player feels it mechanically today | Flavour-only on purpose? |
| --- | --- | --- |
| "The town has been on candles since the plant closed." | Goal 1: sell power by hand | |
| "Nobody can stand at the valve all night." | Goal 3: the first vent | |
| "Swapping spent cells by hand at 3 a.m. is how people get hurt." | Goal 7: perpetual rebuys retire a chore | |
| "The plant clock runs slow." | Goal 11: Improved Chronometers speeds the tick | |
| "Winter is coming. The town needs a reserve for the cold nights." | Goal 13: ten capacitors | |
| "Every empty slot is a house still on candles." | Goal 18: fill every tile | |
| "Three towns are on this grid now. If the station trips, all of them go dark." | Nothing. A meltdown touches no town. | |
| "They have stopped saying what for." | Particles buy research; their use in the world is never stated | |
| "Nefastium. The supplier made you sign twice." | Nothing | |
| "The last crate from the lab came without a manual." | Nothing: experimental parts come with a sheet and a guide entry like every other part | |
| *(new truths from Phase 2)* | | |

### 7.4 The Never List

The rules already locked elsewhere, collected here so they are read together:

- Never state the square law, in the game or in the store.
- Never congratulate a number. No praise, no confetti.
- Never use an exclamation mark in interface text.
- Never use red except for danger and loss.
- Never tell a story beat. No scene, no cutscene, no character on screen.
- Never leave wreckage or a scar after a meltdown.
- Never punish absence: no notifications, streaks or daily rewards.
- Never sell anything, show an ad, or touch the network.
- Never be funnier than deadpan.

The general Soul Interview suggests "never reward the player for doing
nothing (no idle income)". **That one does not transfer.** Here a board that
runs without its operator is the reward for a design that holds (*Absence Is
Play*). What this game refuses is income nobody designed, or time that is spent
behind the player's back.

New lines, from 1.5, 3.6, 6.1 and 6.2:
>

### 7.5 Voice Guide

- **The narrator,** from 3.4: two or three words and one *but*.
- **Five reference lines.** A candidate is on record for each; confirm it or
  rewrite it:

| Slot | On record | In voice |
| --- | --- | --- |
| Greeting | "Day one. Harrow Station has sat cold for eleven years. The key still turns." | |
| Tooltip | A part's one-line description, e.g. the vent: "Holds heat up to its limit and sheds up to its rate every tick. Past its limit it fails." | |
| Error | "A Hardcore run cannot be restored from a save" | |
| Victory | "The valley has power. Keep it that way." | |
| Defeat | "Heat passed twice what the reactor could hold. Every part in it was destroyed." | |

- **Five banned phrasings,** from 3.6.
- **The rewrite rule:** every generic system string is rewritten in voice, or
  kept plain on purpose, with the reason. These are in the build today in a
  default voice:

| String | Where | In voice, or plain on purpose? |
| --- | --- | --- |
| "Save exported" / "Save imported" | `www/js/main.js` | |
| "Copied" | `www/js/ui.js` (layout codes, records) | |
| "\<part\> unlocked" | `www/js/ui.js` | |
| "New in the dock: ..." | `www/js/ui.js` | |
| "Modules unlocked - design one on the Modules page" | `www/js/ui.js` | |
| "Trophy: \<name\>" / "Field note: \<name\>" | `www/js/ui.js` | |
| "That file is not a Reactor Revived save this version can read" | `www/js/main.js` | |
| "Restart the reactor" (the meltdown button) | `www/js/ui.js` | |

### 7.6 Sensory Palette

A hard spec for anyone making art or sound, human or tool. It is filled from
Phase 5 and checked against what already ships:

| | On record | From the interview |
| --- | --- | --- |
| Materials | steel ramp, bevelled frames, checker grain, recessed slot | |
| Colours | ink `#c8d3de`, dim `#7b8794`, power `#58c470`, heat `#d8703a`, cash `#d8c15a`, particles `#b06fd8`; each fuel its own glow | |
| Light | the board warms toward red with heat; grey until abnormal | |
| Three reference images | none | |
| Signature sounds | one hum; six heavy, dull impacts | |
| The quietest sound | the hum at Mark I | |
| Button feel | a heavy drop; a flash with no sound when refused | |

### 7.7 Lore Bible

Three layers, placed by the designer; nobody else places them.

- **Known truths:** what the player can learn from the log and the sheets.
- **Hidden truths, answered as the player climbs:** true, hinted at first, and
  answered outright once the player has climbed far enough (2.6).
- **Sacred mysteries:** **none, by the designer's choice** (2.6: "Answered as
  the player climbs, all of them"). Nothing in this world stays unanswered
  forever. So the answers have to be written, by the designer, before the
  lines that reveal them.

Answered as the player climbs (2.3, 2.4, 2.5, 2.6, 3.1):
- that the valley may have no humans left: its jobs are run by humanoid robots,
  suspected first and found out slowly (3.1)
- that robots need a human leader's approval for reactor roles, those leaders
  are gone, and so the approval never comes: the reason the search found
  nobody (3.1)
- why Harrow Station closed
- why operators who can run it are scarce, and why the plant stayed cold (a
  search found nobody able to start it)
- what the growing demand is really for (the lie that falls apart)
- what the university wants the particles for
- what nefastium is
- what came in the last crate

Unplaced, from the record: who kept the key.

### 7.8 The Soul Check

The soul instance already gates every feature: its Feature Gate card names the
component or pillar a feature serves, traces it, runs the seven-row Instance
Litmus, and checks the banned list. The Soul Check adds three fields to that
card for anything with words, sound or look. They are card fields, not litmus
rows, so the Instance Litmus stays at seven.

```
Voice: is every string in the narrator's voice (7.5), or plain on purpose?
World: does it express a law from 7.3, or is it flavour-only on purpose?
Generic: would it exist, unchanged, in a stranger's reactor idle game? If yes,
         it is hollow; make it Harrow's.
```

Anything that touches the Never List (7.4) is cut, as the banned list already
works.

## After the interview

1. File the answers in this document, verbatim.
2. Put the Soul Sentence, the atmosphere pillar and any changed standing rule
   into the soul instance, with ledger entries for anything that bends
   Containment.
3. Rewrite the strings in 7.5 and settle every row in 7.3 in one pass, then
   extend `test/guide.test.js` to hold the Never List's text rules (no
   exclamation marks; the banned phrasings) over every string the player reads.
4. Re-run the Seed Card (Phase 0 of the soul instance) against 1.3 and 1.4. The
   inferred fortieth minute and next-day story are replaced by the designer's.
