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
>
> Where the gap shows: "As the tasks continue they should move from formal human
> like requests to very robotic direct demands that lack any pleasantries"
>
> *For 7.5:* a voice arc across the log, the same shape as the lie falling
> apart in 2.4. The log as it stands is direct from the first line ("Sell them
> something." "Put a vent on it."), so today it starts where this arc should
> end.

**3.3** Who owns Harrow Station, who sent the operator, and what are they
afraid of?
*Push:* "What would they do to stop that fear coming true?"
*On record:* money comes from the town ("The town's first payment cleared"),
experiments from the university, and fuel from a supplier. Nobody is named as
owner.
> Answer: "Humans hold power and leadership roles on the surface formally, but
> there is no actual leaders 'the ship has no captain a drift at sea set on a
> route mapped out years ago'"
>
> *On record:* the log's institutions keep their forms: "An inspector is
> coming." "The bank called. For once it was not about a loan." The payments
> clear and the letters arrive, with nobody named behind them.
>
> On the route, or off it: "The operator is a new human/robot (not sure yet)
> moving into a new area , looking for a job and finds a reactor with an opening
> today with extravagant pay and every benefit possible
>
> The operator is a new seed ,a spark in the night, an unexpected variable in
> the code"
>
> *On record:* the game opens on "Day one. Harrow Station has sat cold for
> eleven years. The key still turns." Nothing says how the operator came to
> hold the key; no job posting appears.

**3.4** Who writes the operator's log? The game already has a narrator in the
log, the trophies, the tooltips and the errors. What kind of person is it?
*Push:* "Two or three words, and one *but*: tired, dry, kind ... but never
what?"
*On record:* the log speaks in short imperatives with no warmth added ("Put a
vent on it." "Automate it."). The trophies are flat. One line is almost a joke:
*"It is already cold."*
> Answer: "The operator logs were old guides for new operators which change
> over time as the go from very formal startup reactor guides to more more
> more"
>
> The voice: "Technical, concise but never emotional"

**3.5** Write one line exactly as the game should say it.
*Push:* "Now write the line the game should show when a part fails at three in
the morning and nobody is watching."
> Answer (becomes the voice reference): at the designer's request the
> interviewer offered six lines; the designer chose all of them: "Those are all
> good"
>
> 1. "Section 1.1. Before start-up, confirm the operator key is present and
>    turns freely. Harrow Station has been idle for eleven years."
> 2. "Section 2.4. Excess heat should be vented before the reactor is left
>    unattended. Operators are advised not to remain at the valve overnight."
> 3. "Output required: 200 per tick. Clinic load. Maintain overnight."
> 4. "500. Continuous."
> 5. "Increase output. Reason: not required."
> 6. "Component lost: Basic Heat Vent, row 6, column 7. Held 80 of 80. Replace."
>
> *Provenance:* the interviewer's words, chosen by the designer.
>
> The designer's own addition: "later demands could request 200 power then
> cancel and make it 300 like the demands are growing even after being
> requested"
>
> *For 7.3:* the first mechanic proposed for the growing demand, which today has
> none. Under 1.5 ("frustration is failing with no idea why"), a target that
> moves has to say that it moved.

**3.6** What phrase or tone would this game never use?
*Push:* "Which string in the build today comes closest to breaking it?" (See
the list in 7.5.)
*On record:* no exclamation marks anywhere in the interface; no praise; red kept
for danger and loss.
> Answer (goes on the Never List): "Emotional tones should be avoided, binary or
> computer speak, demands should always be understood"
>
> Is "Increase output. Reason: not required." computer speak? "Robotic, but
> understood; that one's fine"
>
> *For 7.5:* the line is understanding. Robotic is allowed as long as the
> player can read it without decoding it.

## Phase 4: The Player's Place

**4.1** Who is the player: hired, returning, inheriting, or something else? Does
the valley notice them?
*Push:* "Why did the key still turn? Who kept it?"
*On record:* the player is "you" in the log, from *"Day one"* onward. Nothing
says how they came to hold the key.
> Answered early, in 3.3: a newcomer, human or robot ("not sure yet"), who
> answers an opening with extravagant pay and every benefit; "a new seed, a
> spark in the night, an unexpected variable in the code". Still open: human or
> robot, and whether the valley notices them.
>
> Human or robot: "Find out as they climb"
>
> *Placed after the letters were built:* "operator is human". Found out as they
> climb: the log's last form letter records the operator as "not a registered
> unit" (7.7, `unregistered`).
>
> Who kept the key, placed after the Lock: "the key was left in the lock by the
> last operator". Nobody kept it; it stayed where it was left.
>
> Does the valley notice them: "The reaction is all automated systems, a new
> power source notices by all nodes/towns that have a lack of power"
>
> Does anything notice the operator: "The operator stays invisible; only the
> power is noticed"
>
> *For 7.4 and 7.5:* no line in the game addresses the operator as a person,
> thanks them, or reacts to them; only to the power.

**4.2** What does the operator want, and what does the valley want from them?
Are those the same?
*Push:* "Where do they pull apart? A mismatch is story without cutscenes."
*On record:* the player chases marks, records and the perfect board; the town
wants the lights on; the university wants particles, and the reboot it asks for
shuts the plant down.
> Answer: at the designer's request the interviewer offered four options built
> from the designer's earlier answers; the designer chose the fourth ("The same
> thing, for different reasons") in their own words: "4 fits best, an operator
> there for the pay, the valley needs power for reason unknown and
> understanding is not required for an operator to provide it"
>
> The player and the operator: "accomplishment pulled from confusion is the
> actual player of the game feeling
>
> In game, the operator is driven by pay alone"
>
> *For the Lock:* two layers, kept apart. The player (the person holding the
> phone) climbs toward understanding; the operator (the one in the world) is
> there for the pay. No line in the game gives the operator the player's
> feelings.

**4.3** For each verb (**place**, **inspect then sell, move or replace**,
**buy**), what does doing it mean inside the fiction?
*Push:* "Placing a part in a plant cold for eleven years is not the same as
placing one in a new build. Which is this?"
> Answer: "They are requests for the reactor demand, from a log book, they are
> notes in a book, we can change phrasing but the ask is the same, add parts,
> upgrade using reactor computer, remove/sell parts to make room, etc"
>
> *For 5.2 and 7.6:* "the reactor computer" is the first named object the
> operator uses. Today the Upgrades page has no fiction; it could be that
> computer. *For 7.3:* the verbs are the job, as the log book asks for it; their
> meaning in the fiction is kept thin on purpose.

**4.4** What does a meltdown mean in the valley? Not the dialog: what actually
happens out there?
*Push:* "The standing rule forbids wreckage. Does it forbid a line?"
*On record:* the sheet says what happened to the reactor and nothing about the
towns on its grid. *"Restart the reactor."* The next job waits as if nothing
happened.
> Answer: "The valley sees a drop in power, but that was the norm, the station
> has been offline so long the new power is the unexpected not the meltdown of
> it"
>
> Does the meltdown sheet mention the valley: "Only about the reactor, the
> valley stays unmentioned"
>
> *For 7.4:* the meltdown receipt speaks only of the reactor. The valley going
> dark is never said.

**4.5** What does the operator lose that they can't get back?
*Push:* "Permanence, even small. Mechanically almost nothing is lost: money and
research survive a meltdown. Is that true in the fiction too?"
*On record:* a meltdown count in Records, and the trophy *Short Fuse*.
> Answer: at the designer's request the interviewer offered five options inside
> the standing rules; the designer chose four: "1,2,3,4 are all good"
>
> 1. Only time: rebuilding is the cost (2.2). True in the build.
> 2. The board itself, exactly as it was, unless saved as a code or a saved
>    layout; no rewind brings it back. True in the build.
> 3. The count: Records keep the number of meltdowns, and "ticks without
>    incident" starts again at zero. True in the build.
> 4. The pay for the dark hours: time the station was dark earned nothing.
>    True in the mechanics, never said in the fiction.
>
> *Provenance:* the interviewer's words, chosen by the designer. Not chosen: a
> first that can only happen once.

**4.6** How is the operator different at the end, and how is the valley
different?
*Push:* "If neither changes, the thirty jobs were decoration."
*On record:* *"Nobody in town remembers the candles now."* The operator's change
is not written anywhere.
> Answer: "Maybe a sense of meloncholy, seeing the ever growing demand,
> infinite growth,
>
> The valley glows and in a very robotic response confirms power demands
> completed"
>
> *On record:* the log's last line is close already: "The valley has power. Keep
> it that way." *For 6.3:* the demands are "completed" at the end, and the
> demand is "infinite growth".
>
> Whose melancholy, the player's or the operator's: "Both"
>
> *For 6.3:* in 4.2 the operator is "driven by pay alone"; here the operator
> ends melancholy. And the narrator is never emotional (3.4), so the game must
> produce the melancholy without ever naming it.

## Phase 5: Texture

**5.1** What does the control room smell like? What is the weather doing
outside?
*Push:* "Which season is the game set in, if the log says 'Winter is coming' at
job 13?"
> Answer: "It should feel cold, industrial, mildly musty but maintained
>
> Outside foggy, dreary, overcast, a chill in the air"
>
> *For 6.3 (resolved below):* the control room is "maintained"; in 2.7 the
> plant's complaint is "poorly maintained infrastructure".
>
> Maintained by whom: "Maintain as the control room was left in fairly clean
> order but under the hood core infrastructure needs reviewed and replaced"
>
> *Resolved:* a clean surface over a failing core. *On record:* replacing is
> already a verb (a part's sheet, and "Replace or upgrade all"), and every tier
> upgrade is a part swapped for a better one.

**5.2** What is the plant made of? What does the operator touch?
*Push:* "Name a material in the build today that is wrong."
*On record:* steel frames with bevels (Buch's, recoloured to a steel ramp), a
checker grain on every face, a recessed odometer slot, part sprites with a
steel body and a black outline.
> Answer (becomes the material palette): "The control room is very Chernobyl
> USSR with industrial buttons, gauges, valves"
>
> *Red flag:* "Chernobyl" is on this interview's list of nuclear shorthand. Pushed
> below for what it means specifically. *For 6.3:* the setting on record is
> Harrow Station, a valley with a mill, a clinic, a co-op and a bank, and the
> money is dollars.
>
> Without the word: "Tactile switches knobs, mechanical controls, valves,
> blinking lights , manual overrides"
>
> *On record:* the build has two mechanical controls already: the money rolls on
> digit drums behind a recessed slot, and the power and heat bars are the
> buttons that sell and vent by hand, which are manual overrides in all but
> name.
>
> Made of: "Soviet off color plastics, teal/orange metal plating"
>
> Wrong in the build today: "Any computer automated systems like heat operator
> controls without a visual indicator in the reactor, any system without a
> visual light or button to toggle"
>
> *On record:* teal was taken out once. The interface is cut from Buch's frames,
> which are drawn in lilac and teal, and every colour was remapped to a steel
> ramp (README, "Interface skin"). Orange is already the heat colour. The
> automated systems today have no light on the reactor page: Heat Control
> Operator's switch sits on the Upgrades page under its upgrade, and auto-sell
> and perpetual rebuys, once bought, have no light and no switch anywhere.
> *For 7.3 and 7.6:* every automated system gets a light and a switch the
> operator can see from the reactor.

**5.3** What is the light like: time of day, colour temperature, where shadows
fall?
*Push:* "Is the operator working days or nights?"
*On record:* a board that warms toward red with heat, tile bars that stay grey
until four-fifths full, each fuel glowing in its own colour.
> Answer: "Operator time is actual player time, maybe some very basic seasonal,
> time related coloring/shading of game board"
>
> *On record, for 7.6:* the board's colour already carries meaning. It warms
> toward red with the reactor's heat, and a tile's bar stays grey until
> four-fifths full, because colour is kept for abnormal states (README, "Heat
> you can see"). House rule 2 bars any clock outside the game that punishes
> absence; a light that follows the time of day punishes nothing.
>
> Night and day: "A day reactor uses actual outside light vs night reactor
> using internal artificial lighting"
>
> *For 7.6:* by day, the light is whatever comes through the fog and overcast of
> 5.1; by night, the room's own lamps.

**5.4** What is the quietest sound in the game, and why does it matter?
*Push:* "What is quieter than the hum at Mark I?"
*On record:* the hum murmurs at 0.75x speed when cold and settles lower once
Mark I is earned; all impact sounds duck by up to 60% near the limit.
> Answer: "the click clanking of shifting/moving/placing parts"
>
> *On record:* placing plays one of six impacts from Kenney's Impact Sounds,
> chosen by measurement for being heavy and dull; the README's example of a
> winner is a heavy wooden impact, and nothing records which impact became the
> place sound. Moving a part plays the same place sound. *For 7.6:* "clanking"
> is metal; set it beside the teal and orange metal plating of 5.2.
>
> Why it matters: "It tells you the physical weight, the effort of your actions,
> the heavyness of the situation"

**5.5** What does a button press feel like here, and what in the plant does it
stand for?
*Push:* "Which press in the build today feels most like an app and least like
a plant?"
*On record:* six impacts, chosen for being heavy and dull; a placed part settles
with a small heavy drop; money rolls on drums.
> Answer: "Buttons should be tactile mechanical double click industrial slow"
>
> What "double click" and "slow" mean: "Two-stage click-clack sound, slow in
> feel not speed"
>
> *For 7.6:* a press is one tap, heard as two stages (click, then clack), with
> weight and travel in how it looks and sounds. Nothing takes longer to act:
> painting a row and Time Flux keep their speed.
>
> Which press feels most like an app: "Buying upgrades feels very app like"
>
> *For 7.6:* today an upgrade is a card in a scrolling list on the Upgrades
> page, bought with a tap and a "buy" sound. In 4.3 upgrades are made "using
> reactor computer", which the page could become.

**5.6** Name three real images or places that are this world's look.
*Push:* "A photo you could send. Not a game, not a film, not Chernobyl."
> Answer: four photographs, sent by the designer (not stored in the repo; their
> sources unknown: "googled images, no sources found"). Reference only: never
> stored in the repo, copied, traced or shipped, since nobody can say who owns
> them. As the interviewer describes them:
>
> 1. An old, empty control room under a glass skylight: curved walls of
>    bottle-green and cream panels full of round gauges and switches, a
>    process diagram painted in line along the upper wall, a dark operator's
>    desk in the middle, an orange ceiling, daylight from above.
> 2. A stone stair climbing through thick fog toward dark towers, iron railings
>    and tall lamp posts with a few warm lamps lit, one person walking up.
> 3. A grid control room's wall-sized mimic board: an ivory board crossed by lit
>    yellow and pink lines through round nodes, red seven-segment readouts,
>    analog clocks, and modern monitors at its foot.
> 4. A control panel painted with its own process diagram in orange, blue and
>    black lines, rows of round dials and small windows, and a desk of black
>    levers and toggles below.
>
> *What they share:* three of the four are control rooms whose walls draw the
> process itself (a mimic diagram), so the operator reads the plant's flow off
> the wall. The fourth is the valley outside: fog, iron, a few lamps.
>
> Which one is Harrow's control room: "The white with orange and blue
> panels/gauges fits best" (the fourth).
>
> *For 7.6:* the lead reference is a pale panel painted with its own process
> diagram in orange, blue and black, round dials, and a desk of black levers
> and toggles. It sits beside the "teal/orange metal plating" of 5.2.
>
> What the foggy stair gives: "The fog is the dreary outside essence"
>
> Added after the interview: "Stalenhag images have a certain ethos that seems
> fitting for this genre … It would be nice to incorporate them into this game
> either spiritually through design UI/UX changes to actual background
> wallpapers"
>
> *On record:* Simon Stålenhag's paintings are his copyright. Wallpaper sites
> that host them say the images are for private, non-commercial use, and this
> game ships on the Play Store from a public repository. No licence for any
> Stålenhag image, or for backgrounds from Reactor Revival, is recorded in this
> repo. Until one is, the ethos can be carried only by the game's own design.
>
> Their provenance: "I made them inspired by stalenhag but full free use" (the
> thirty paintings in Reactor Revival's `public/img/misc/stalenhag_bg/`).
>
> *Built:* four of them, chosen by the interviewer for fog, flat grey light and
> green country (Revival's 25, 12, 3 and 17), stand behind the board as the
> valley outside: one per season, darkened after seven (5.3), seen faintly
> through the empty slots, fading as the reactor heats, still, and never in the
> planner. Credited as the designer's own, in the manner of Simon Stålenhag.
> Left out on purpose: the deserts, the gun turret, and the giant robot, which
> would give away the robot mystery (3.1).

## Phase 6: Tensions and Taboos

**6.1** What would a player expect from a nuclear game, or an idle game, that
this one should refuse, on the atmosphere side?
*Push:* "The mechanical refusals are already written (the soul instance's
banned list). Name an image, a sound or a word."
> Answer (goes on the Never List): "No in app purchases(diamonds, boosts,
> skills)
>
> Cartoony glossy blobby characters should be avoided
>
> Bright colored icons, material modern design"
>
> *On record:* the first is already house rule 2 (nothing sold). The build has
> no characters at all. It does colour its icons: every interface icon is an
> inline SVG, and each dock part shows its numbers in its corners with the rate
> bar's icons in bright colours by kind (power blue, heat red, life purple,
> money green; `www/css/app.css`).
>
> Do the dock's coloured icons cross the line: "Coloured signals are fine, just
> not bright glossy icons"
>
> *For 7.4 and 7.6:* colour that carries information is allowed; gloss and
> decoration are not.

**6.2** The fair-play contract already refuses daily rewards, ads, a battle
pass and notifications. Which one would hurt the *valley* most if it arrived,
and why?
*Push:* "The answer says what the town values."
> Answer: "The game is a solo quest of accomplishment from the player
> perspective, ads break the 4th wall, a diamond store breaks the 4th wall, an
> in-game boost cheapens the reward of accomplishment"
>
> *On record:* the build has things that touch the fourth wall without selling
> anything. Options holds a lineage page naming the real games (IC2, Reactor
> Incremental, Knockoff) and their authors; the trophy "Ancestor Worship" is
> earned by naming a design after one of them; typing "mark i" as a code builds
> IC2's checkerboard. And Time Flux spends banked time at ten times speed: a
> speed-up, earned by being away, never bought.
>
> The lineage nods, and Time Flux: "Lineage nods are fine, Time Flux is earned
> not a boost"

**6.3** Which answers contradict each other, or contradict a standing rule?
Keep each contradiction, or resolve it?

*Push:* "Some contradictions are the soul, and some are confusion. Which is
each?"

Collected from Phases 0-5, with where each was noted. Each gets its own answer
below. Any changed standing rule is ledgered in the soul instance.

Already settled during the interview:
- ~~"Unknown on purpose" against "answered as the player climbs"~~ (2.3, 2.6):
  all mysteries are answered as the player climbs.
- ~~A maintained control room against poorly maintained infrastructure~~ (2.7,
  5.1): a clean room over a failing core.
- ~~A clean-wipe meltdown against towns that go dark~~ (4.4): dark is the
  valley's norm, and the receipt never mentions it.

To settle:
1. **Looking closer, or looking away.** The session ends "looking in
   concentration reviewing the parts" (0.3) and "watching it flow together"
   (1.1). Containment ends it by looking away ("a good design is one you can
   stop watching"; the instance: "good enough to put in your pocket").
2. **More struggle, or a build that took pain out.** "More of the struggle, the
   pain" (0.3), against free refunds, no gesture that destroys, a planner that
   forecasts failure, and Flow. 1.5 drew a line: "Frustration is failing with
   no idea why, the struggle is the slow climb of knowledge."
3. **The insider layer, and help inside the game.** The insider layer came from
   "looking up online layouts" (0.2); "having to leave the app to search for
   help" must never be felt (1.5); and the game ships example layouts in its
   log.
4. **The accelerator layout, handed over.** The story players would tell is
   figuring out the accelerator layout (1.4); the log opens it as an example at
   goal 22.
5. **Complete, or endless.** The last hour is "maxed out all parts and
   upgrades … no more goal/objectives" and demands "completed" (1.3, 4.6);
   progress is infinite, layouts are endless, demand grows forever (1.4, 2.1,
   4.6); Containment is a Rebirth Account that never ends.
6. **Rebuilding is the cost, and rebuilding is one tap.** "Rebuilding is the
   cost" (2.2), against layout codes, saved layouts and the planner's Build,
   which put a board back at once outside Hardcore. The designer's reply:
   planning takes knowledge, so it is "pretty restricted for new users".
7. **A crumbling plant, and no random failures.** "Failing pipes … poorly
   maintained infrastructure" (2.7), against the banned tone killer: a part that
   fails for a reason the design did not cause.
8. **Paid, or melancholy.** The operator is "driven by pay alone" (4.2) and ends
   melancholy (4.6); the narrator is never emotional (3.4).
9. **Where Harrow is.** Harrow Station, a valley with a mill, a co-op and a
   bank, paid in dollars; a control room that is "very Chernobyl USSR", in
   "Soviet off color plastics" (5.2).
10. **Which game is the parent.** Reactor Incremental is the childhood game being
    revived (0.2); the repo calls Knockoff the direct parent and checks the
    balance against it, and house rule 1 is "Inside the Lineage".
11. **A universe, and the standing rules.** Robots, an approval that never
    comes, a lie that falls apart, and every mystery answered as the player
    climbs, against "no story beats" and Immersion rated Low.

> Answers:
>
> 1. Looking closer, or looking away: "Both, struggle first then watch it flow"
>    And the pocket: "You watch confirm stability and can leave confident the
>    reactor is stable"
>    *Settled, and kept:* a session runs struggle, then watching it flow, then
>    confirming it holds, then leaving. Containment's "stop watching" is the last
>    step, not the whole.
>
> 2. More struggle, or a build that took pain out: "All four are fine, they help
>    you understand why, forecast is only for planner not live reactor as a
>    means of reviewing and testing"
>    *Settled, and kept:* free refunds, no destructive gestures, the planner's
>    forecast and Flow stay; each helps the player learn why. The forecast
>    stays in the planner, as it is today ("Forecasts live only in the
>    planner").
>
> 3. Where a player learns from better layouts: "From the game itself"
>    *Settled:* the insider layer lives inside the game, in its example layouts
>    and their broken copies. Nobody has to leave the app to get past the cap.
>
> 4. The accelerator layout, handed over: "Show less of it so players figure it
>    out
>
>    Use a middle ground of showing how about much power needs pushed into a
>    tier 1 accelerator to start making EP and not immediately blow up"
>    *Settled, with a change for the Lock:* goal 22 teaches the accelerator's
>    numbers, not its layout. (In the build an accelerator runs on heat, not
>    power: it makes particles from the heat it holds, most at half full, and
>    holds twice its particle heat. The parts guide already says so; the
>    "Feeding an accelerator" example goes further and hands over the farm.)
>
> 5. Complete, or endless: "Both, content ends but demand keeps growing"
>    *Settled, and kept:* the parts, upgrades and log are finite and can all be
>    finished; the demand never is. For the Lock: the finished state needs to be
>    noticed (1.3), and the demand needs a form that goes on past job 30 (2.1,
>    3.5).
>
> 6. Rebuilding is the cost, and rebuilding is one tap: "Keep it, rebuilding is
>    earned by knowledge and will cost more then a player has usually after
>    losing everything in the reactor"
>    *Settled, and kept.* *On record:* a meltdown keeps the money, and a rebuilt
>    code queues every part the player cannot yet afford, so the board comes
>    back as the money does. How much of a board a player can rebuild at once
>    after a meltdown has not been measured.
>
> 7. A crumbling plant, and no random failures: "Keep it as flavour, fixed by
>    upgrades like those"
>    *Settled, and kept:* the plant's decay is told in the log and answered by
>    upgrades and actions the player chooses, like the sticking gauge (goal 2)
>    and the slow clock (goal 11). Nothing ever fails at random.
>
> 8. Paid, or melancholy: "Keep both, pay first then melancholy creeps in"
>    *Settled, and kept:* the operator arrives for the pay; the melancholy
>    arrives later, unnamed, carried by what the log stops saying and what the
>    demand keeps asking (3.2, 3.4, 4.6). No line names the feeling.
>
> 9. Where Harrow is: "Keep the mix, the mismatch is part of the mystery
>
>    An old USSR reactor build in a very English UK fog overcast dreary
>    environment is very intriguing"
>    *Settled, and kept:* a Soviet-built control room in an English valley. Why
>    it is there joins the mysteries answered as the player climbs. *Settled
>    after the Lock:* the money stays in dollars ("dollars are fine").
>
> 10. Which game is the parent: "Name Incremental as the parent, Knockoff as the
>     route"
>     *Settled, with a change for the Lock:* the README, docs/soul.md and the
>     soul instance's house rule 1 name Reactor Incremental as the game being
>     revived, and Knockoff as the route it survived by. The balance can stay
>     checked against Knockoff running live, as long as the docs say why.
>
> 11. A universe, and the standing rules: "Allow some character building, some
>     environment building, some storytelling"
>     *Bends two standing rules:* "no story beats" and Immersion rated Low. For
>     the soul instance's ledger once its bounds are set (below).
>
>     The bounds: "Letters and log entries only, never interrupting play
>
>     Optional sauce not required or interruptive"
>     *Settled, with a ledger entry at the Lock:* "no story beats" becomes
>     "story only in letters and log entries: optional, never required, never
>     interrupting play". Immersion moves off Low for the soul instance's
>     Psychological Target, with the same bounds.

**6.4** If you cut 80% of the atmosphere, which 20% keeps it recognisably
Harrow? Which lines, sounds and colours?
*Push:* "Would you keep the town, or only the plant?"
> Answer: "A control room and an ever growing demand for power is the core"
>
> The one detail that makes it Harrow's: "The silence, the lack of outside
> prompts/requests, an idle request waiting on fulfillment, alone loneliness"
>
> *On record:* the build already keeps one request at a time. The goal line
> shows the current job and nothing else, no toast marks a goal met, and the
> interface goes quiet as the reactor heats. *For 7.2:* the minimum form is a
> silent control room, one request waiting, and an operator alone with it.

**6.5** Picture a stranger's reactor idle game with all ninety parts, the
planner and the marks, and none of the heart. What exactly is missing from it?
*Push:* "Which of those missing things is missing from this build too?"
> Answer (lists what the Lock must protect): "Its lacks an atmosphere, a why, a
> reason for continuing, a grid reactor game with no drive or push forward,
> relying purely on a players want for more"
>
> How close is this build: "Closer to the hollow version, it lacks the why"
>
> *For the Lock:* the build's machine is whole; its why is missing. Phases 2-4
> hold the answers the why is made from.

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

> Soul sentence: **"Paid to start a Soviet reactor nobody else could, in an
> English fog, you learn it alone until it holds. The valley asks for more."**
> (25 words)
>
> *Provenance:* merged by the interviewer from three drafts built on the
> designer's answers (0.1, 1.1, 2.5, 3.3, 4.2, 5.1, 5.2, 6.3); chosen by the
> designer. It drops one idea the designer had kept, "a valley that never says
> why". *Test:* it could not describe IC2, Reactor Incremental or Knockoff.

### 7.2 Pillars

The machine already has its pillars: Containment's four, and the instance's two
house rules. An instance allows at most three house rules, so **the atmosphere
gets one pillar in the instance**. Anything more is carried by the Never List
and the Voice Guide instead. Each pillar needs all four parts, or it is a
slogan.

| Pillar | This means... | This forbids... | Test for any feature, line or asset |
| --- | --- | --- | --- |
| **One Request, Waiting** | One request at a time, in a silent room. The demand arrives as a line in the log and waits. | Stacked quests, badges, timers on requests, anything that fills the silence. | "Does this add a second request, or a second voice, to the room?" → reject |

*Provenance:* drafted by the interviewer from 6.4 ("The silence, the lack of
outside prompts/requests, an idle request waiting on fulfillment, alone
loneliness"), one of three drafts; chosen by the designer. It becomes the soul
instance's third house rule.

*Self-test on the build* (a pillar that cuts nothing is written to pass). Each
of these adds a second voice or a badge to the room today:
- the dot on the goal line marking an example layout waiting in the log
  (`www/js/ui.js`)
- a toast for every part unlocked, every new dock part, modules unlocking, a
  trophy and a field note (`www/js/ui.js`)
- the toast that closes a Time Flux run (`www/js/main.js`)

Each gets a verdict at the Soul Check: change, cut, or keep with a ledger
entry.

### 7.3 World Laws to Mechanics

Every truth shows up as something the player feels in play, or is marked
flavour-only on purpose. **No log line, letter, trophy name or field note ships
without a row here.**

Each truth gets one of four verdicts from the designer:
- **Felt:** a mechanic already carries it.
- **Mechanic:** a system to build (only systems the designer proposed are named).
- **Letters:** told in letters or log entries, the one channel story may use
  (6.3).
- **Flavour, on purpose:** true, and never felt.

How each is felt today was checked against the build. The last column is the
designer's.

Verdicts given by the designer in bulk: groups A (mysteries) and C (voice) as
Letters, group B (proposed systems) as Mechanic; infinite scale and the
crumbling plant Felt; the reactor computer Mechanic.

**The world's truths (Phases 2-6)**

| Truth | Source | How the player feels it today | Proposed in the interview | Verdict |
| --- | --- | --- | --- | --- |
| Progress and scale are infinite; resources are spent | 2.1 | Money, power and particles grow without limit; every upgrade has a ceiling | | Felt |
| A meltdown is finite and leaves no mark on the world | 2.1 | A clean wipe that keeps money, research and records | | Felt |
| Demand only ever grows | 2.1, 2.5 | Built: three late jobs (14, 20, 27) are cancelled when first met and asked again half as much higher, said on the goal line and in the log book; past job 30 a standing order is always above the reactor's output and never falls (7.5, requests that grow) | Requests that grow after they are made: 200, cancelled, now 300 (3.5) | Mechanic, built |
| The options grow more complex | 2.1 | A part appears once ten of the one before it are placed; families arrive with the log; a doctrine set every five goals | | Felt |
| Power is the cost; complexity brings instability | 2.2 | Heat grows faster than power as cells crowd; meltdowns | | Felt |
| Rebuilding is the cost | 2.2, 6.3 | The board is lost; rebuilt codes queue what cannot be afforded | | Felt |
| Knowledge is scarce | 2.5 | The guide states rules, never answers; the examples teach inside the game (6.3); goal 22 shows the accelerator's numbers and no layout (built) | Goal 22 teaches the accelerator's numbers, not its layout (6.3) | Mechanic, built |
| The plant is crumbling | 2.7, 6.3 | The sticking gauge (goal 2), the slow clock (goal 11) | Kept as flavour, fixed by upgrades like those (6.3) | Felt |
| The demand is a lie that falls apart | 2.4 | Late log lines stop explaining; past job 30 the standing order gives its reason as "not required" | | Letters, accepted: `works` |
| Why the plant closed | 2.3 | Nothing | Answered as the player climbs (2.6) | Letters, accepted: `suspension`, `director` |
| Capable operators are scarce; the search found nobody | 2.5 | Nothing | Answered as the player climbs | Letters, accepted: `vacancy`, `director` |
| The valley may be run by humanoid robots | 3.1 | Nothing | Suspected, then found out slowly | Letters, accepted: `clock`, `torch`, `continue`, `unregistered`, `works`, `courier` |
| Reactor roles need a human leader's approval; the leaders are gone | 3.1 | Nothing | Answered as the player climbs | Letters, accepted: `suspension`, `queue`, `director` |
| The robots link task lists without complaints or compliments | 3.2 | The log gives orders; no string praises the player | | Felt |
| The voice drifts from formal guides to bare demands | 3.2, 3.4 | Built: jobs 0-9 are manual sections, 10-19 work orders, 20-29 bare demands (7.5, the log's voice arc); test/voice.test.js holds the shape | | Mechanic, built; wording accepted |
| The ship has no captain | 3.3 | Institutions act with nobody named behind them | | Letters, accepted: `director`, `programme` |
| The operator answered an opening with extravagant pay | 3.3, 4.2 | Nothing: no posting, and nothing says pay | | Letters, accepted: `vacancy` |
| Human or robot, the operator finds out | 4.1 | Nothing | Answered as the player climbs | Letters, accepted: `unregistered` |
| Only the power is noticed | 4.1 | No line addresses the operator | | Felt |
| The verbs are the log book's asks; upgrades are made on the reactor computer | 4.3 | Built: Upgrades and Experiments are the plant computer's two screens; a purchase is a key pressed through, heard as click then clack, and the prompt line says what was authorised (7.5, the plant computer) | | Mechanic, built |
| A meltdown returns the valley to its dark | 4.4 | Never said, by the designer's choice | | Flavour, on purpose |
| What is lost: time, the board, the count, the pay for the dark hours | 4.5 | All four are true in the build | | Felt |
| The content ends; the demand never does | 4.6, 6.3 | Built: when the log, every part, every upgrade and the board are complete, the log book files a robotic confirmation ("… Demand continues."), Records says All complete, and the valley stays lit. The demand goes on as the standing order (7.5) | Notice the finished state (1.3) | Mechanic, built |
| Melancholy creeps in, unnamed | 4.6, 6.3 | Nothing | Carried by what the log stops saying (6.3) | Letters (the log's voice) |
| Unpausing is the on switch | 1.1 | Built: the header's switch reads On or Off with a lamp; a new station starts off, and turning it on is the tutorial's third card | | Mechanic, built |
| Every automated system has a light and a switch | 5.2 | Built: Sell, Rebuy and Operator switches with lamps on the reactor's panel | A light and a switch on the reactor for each | Mechanic, built |
| A Soviet-built reactor stands in an English valley | 6.3 | Nothing | Answered as the player climbs | Letters, accepted: `drawings`, `export` |

**The log's lines on record**

| Line | How the player feels it today | Verdict |
| --- | --- | --- |
| "The town has been on candles since the plant closed." | Goal 1: sell power by hand | Felt. In the arc: "…on candles since the station closed." |
| "Nobody can stand at the valve all night." | Goal 3: the first vent | Felt. In the arc: the 3.5 reference, "Operators are advised not to remain at the valve overnight." |
| "Swapping spent cells by hand at 3 a.m. is how people get hurt." | Goal 7: perpetual rebuys retire a chore | Felt. In the arc: "Replacing spent cells by hand at 3 a.m. has caused injuries." |
| "The plant clock runs slow." | Goal 11: Improved Chronometers speeds the tick | Felt. In the arc: "Station clock running slow." |
| "Winter is coming. The town needs a reserve for the cold nights." | Goal 13: ten capacitors | Felt. In the arc: "Winter reserve required. Cold nights." |
| "Every empty slot is a house still on candles." | Goal 18: fill every tile | Felt. In the arc: "Every empty slot is a house on candles." |
| "Three towns are on this grid now. If the station trips, all of them go dark." | Nothing. A meltdown touches no town (and 4.4 keeps it unsaid). | Flavour, on purpose. In the arc: "…all three go dark." |
| "They have stopped saying what for." | Particles buy research; their use in the world is never stated | Letters. In the arc the log itself stops: "Reason: not required." Answered in the letters: `programme`, `objective`. |
| "Nefastium. The supplier made you sign twice." | Nothing | Letters. In the arc: "Nefastium. Signed for twice." Answered in the letters: `signatures`. |
| "The last crate from the lab came without a manual." | Nothing: experimental parts come with a sheet and a guide entry like every other part | Letters. In the arc: "Crate received. No manual. Install." Answered in the letters: `objective`. |

*The lines above are as the interview found them. The log's voice arc (7.5)
rewrote them; each keeps its meaning and verdict.*

**The letters** (6.3: story only in letters and log entries), built and accepted.
A letter is filed in the operator's log as the station climbs, with one silent
line in the log book ("Letter received: …"); it opens in place, and nothing
outside the log says it came. Each hints before it answers; every mystery in
7.7 is answered by the end (2.6). Like the log, they speak of the station and
the power, never to the operator (4.1). The letters and the answers they give
were drafted by the interviewer and accepted by the designer whole ("accept the
letters"), with one answer placed by the designer: the operator is human (7.7). test/letters.test.js holds the rules: the order, a hint before
each answer, every mystery answered, the voice, the university's letters
getting shorter (3.1, the courier's worry), and a row here for every letter.

| Letter | From | Arrives | Text | Hints and answers | Verdict |
| --- | --- | --- | --- | --- | --- |
| `suspension` | Regional Energy Authority | Job 2 | "Found in the control-room desk. Notice of suspension. Harrow Station. The operator of record has retired. No successor has been approved. Operation is suspended pending the approval of an operator by the Director of Appointments. Operator key: left in the lock." | hints: why harrow station closed; hints: why the approval never comes | Letters, accepted |
| `vacancy` | Situations Vacant, Harrow and District | Job 5 | "Operator required. Harrow Station. Immediate start. Pay above scale. Housing, fuel and every benefit. This notice has been issued weekly for eleven years. Issue 573. Applications received: 1." | hints: why operators are scarce, and the plant stayed cold | Letters, accepted |
| `drawings` | Harrow Supply | Job 8 | "Parts for this reactor are made to its original drawings. The drawings are not in English. Sections 1 to 4 of the operating manual have been translated. Section 5 onwards has not." | hints: why a soviet-built reactor stands in an english valley | Letters, accepted |
| `queue` | Regional Energy Authority | Job 11 | "Application for approval: operator, Harrow Station. Received. Position in queue: 1. Awaiting the Director of Appointments." | hints: why the approval never comes | Letters, accepted |
| `clock` | Harrow Town Clerk | Job 13 | "The market hall clock runs slow, by the amount the station clock did. Its keeper has wound it daily for forty-one years, without leave. He asks which clock is set by which." | hints: whether the valley's people are people | Letters, accepted |
| `torch` | Harrow Clinic, night ward | Job 16 | "Machines run overnight: fourteen. Torch not required since the first of the month." | hints: whether the valley's people are people | Letters, accepted |
| `director` | Regional Energy Authority | Job 19 | "Approval of operator, Harrow Station: pending. The post of Director of Appointments is vacant. Appointments to that post are made by the Director of Appointments." | answers: why the approval never comes; answers: why harrow station closed; answers: why operators are scarce, and the plant stayed cold | Letters, accepted |
| `export` | Harrow Supply | Job 21 | "This reactor was bought under an export agreement and assembled here from crates. The other party to the agreement no longer exists. Parts continue to be made to its drawings." | answers: why a soviet-built reactor stands in an english valley | Letters, accepted |
| `programme` | University, Department of Physics | Job 22 | "An accelerator has been installed at Harrow Station. Particles are to be collected and dispatched weekly, as set out in the programme. The programme was set by the Faculty. The Faculty has not met since." | hints: what the university wants the particles for | Letters, accepted |
| `continue` | University, Department of Physics | Job 25 | "Opened in transit. Resealed by hand. Particles received. Continue." | hints: whether the valley's people are people | Letters, accepted |
| `signatures` | Harrow Supply | Job 28 | "Nefastium is made at the university's accelerator from the particles sent there. It is not found in nature. Two signatures are required on receipt: the operator's, and a supervising officer's. Where no supervising officer is present, the operator signs for both." | answers: what nefastium is | Letters, accepted |
| `objective` | Packing slip, the last crate | Job 29 | "Found in the crate. Department of Physics programme. Objective: a reactor that runs without an operator. Contents: first parts of the series. Manual: not required." | answers: what the university wants the particles for; answers: what came in the last crate | Letters, accepted |
| `unregistered` | Regional Energy Authority | The log finished (job 30) | "Operator of record, Harrow Station: not approved. The operator is not a registered unit. Approval applies to registered units only. No action required." | answers: what the operator is; answers: whether the valley's people are people | Letters, accepted |
| `works` | Harrow Works | Three standing orders met | "Units completed this year: 1,208. Each is issued a task list and a load. The schedule has not been revised since it was issued. Increase output." | answers: what the demand is for | Letters, accepted |
| `courier` | The courier | Everything complete | "Nothing to deliver this week. Came anyway." | hints: whether the valley's people are people | Letters, accepted |

### 7.4 The Never List

The rules already locked elsewhere, collected here so they are read together:

- Never state the square law, in the game or in the store.
- Never congratulate a number. No praise, no confetti.
- Never use an exclamation mark in interface text.
- Never use red except for danger and loss.
- ~~Never tell a story beat.~~ Changed in 6.3: story lives only in letters and
  log entries, optional, never interrupting play (see below). Still never a
  scene, a cutscene, or a character on screen.
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
- Never make the player bored, or fail with no idea why (1.5).
- Never make the player leave the app to search for help (1.5).
- Never let one layout become the only answer, so the game repeats (1.5).
- Never use an emotional tone (3.4, 3.6).
- Never use binary or computer speak (3.6).
- Never write a demand the player cannot understand (3.6).
- Never sell a currency, a boost or a skill (6.1).
- Never draw cartoony, glossy, blobby characters (6.1).
- Never use bright, glossy icons or modern material design (6.1). Colour that
  carries a signal is allowed.
- Never tell story anywhere but letters and log entries; never make it
  required, and never let it interrupt play (6.3).
- Never let the world see or thank the operator; only the power is noticed
  (4.1).
- Never explain the demand before the player has climbed to its answer (2.4,
  2.6).
>

### 7.5 Voice Guide

- **The narrator,** from 3.4: **technical, concise, but never emotional.** The
  log is old guides for new operators, drifting from formal start-up guides to
  bare demands (3.2, 3.4).
- **Five reference lines.** A candidate is on record for each; confirm it or
  rewrite it:

| Slot | On record | In voice |
| --- | --- | --- |
| Greeting | "Day one. Harrow Station has sat cold for eleven years. The key still turns." | Accepted: "Section 1.1. Start-up. Confirm the operator key is present and turns freely. Harrow Station has been idle for eleven years." |
| Tooltip | A part's one-line description, e.g. the vent: "Holds heat up to its limit and sheds up to its rate every tick. Past its limit it fails." | Accepted: keep as is; already technical and concise |
| Error | "A Hardcore run cannot be restored from a save" | Accepted: "Restore refused. A Hardcore run cannot be restored from a save." |
| Victory | "The valley has power. Keep it that way." | Accepted: "Demand met. All listed loads supplied. Maintain output." |
| Defeat | "Heat passed twice what the reactor could hold. Every part in it was destroyed." | Accepted: "Meltdown. Core heat exceeded twice rated capacity. All components destroyed." In the build without its first word, which the sheet's heading already says: "Core heat exceeded twice rated capacity. All components destroyed." |

- **Banned,** from 3.6 and 6.1: any emotional tone; binary or computer speak;
  a demand the player cannot understand without decoding it; praise of any
  kind. Robotic is allowed when it is understood ("Increase output. Reason: not
  required." passes).
- **Voice references,** chosen in 3.5 (the interviewer's drafts): "Section 1.1.
  Before start-up, confirm the operator key is present and turns freely. Harrow
  Station has been idle for eleven years." (early); "Output required: 200 per
  tick. Clinic load. Maintain overnight." (middle); "500. Continuous." and
  "Increase output. Reason: not required." (late); "Component lost: Basic Heat
  Vent, row 6, column 7. Held 80 of 80. Replace." (a failure).
- *The wording in the tables was drafted by the interviewer; the designer
  accepted all of it.*
- **The log's voice arc** (3.2, 3.4, 2.4), built and accepted: the log is an old
  start-up guide that becomes work orders, then demands. Jobs 0-9 are numbered
  manual sections (the numbering skips, as excerpts do); jobs 10-19 are work
  orders, still giving a reason; jobs 20-29 have stopped giving one, and the
  lie about what the power is for falls apart ("Use: not stated", "Reason: not
  required"). Jobs 0 and 30 are the accepted Greeting and Victory. Every line
  keeps the meaning 7.3 gave it. The shape is held by test/voice.test.js
  (manual sections first, no pleasantries, shorter in each third); the words
  were drafted by the interviewer and accepted by the designer ("accept all the
  draft wording").

| Job | Title | Accepted |
| --- | --- | --- |
| 0 | Place your first part in the reactor | Accepted: "Section 1.1. Start-up. Confirm the operator key is present and turns freely. Harrow Station has been idle for eleven years." |
| 1 | Sell power: tap the power bar | Accepted: "Section 1.2. Sale of output. The town has been on candles since the station closed. Output is sold at the power bar." |
| 2 | Vent by hand: tap the heat bar 10 times | Accepted: "Section 1.3. Heat gauge. The gauge is known to stick. Vent by hand and confirm the reading falls." |
| 3 | Cool a cell with a Heat Vent | Accepted: "Section 2.4. Excess heat should be vented before the reactor is left unattended. Operators are advised not to remain at the valve overnight." |
| 4 | Buy an upgrade | Accepted: "Section 2.6. Maintenance budget. The town's first payment has cleared. It is to be spent on the plant." |
| 5 | Place a Dual cell | Accepted: "Section 3.1. Deliveries. Supply sent Dual cells by mistake. Install one and record the result." |
| 6 | Run 10 cells at once | Accepted: "Section 3.3. Load increase. The mill has requested a second shift. Ten cells are to run at once." |
| 7 | Buy a Perpetual cell upgrade | Accepted: "Section 4.1. Night refuelling. Replacing spent cells by hand at 3 a.m. has caused injuries. Automate replacement." |
| 8 | Place a Capacitor | Accepted: "Section 4.2. Storage. Output produced between sales is lost. Install storage." |
| 9 | Design and place a module (Modules) | Accepted: "Section 4.5. Spares. Spare cores are to be kept in casings, ready to install. Design one and install it." |
| 10 | Make 200 power per tick | Accepted: "Output required: 200 per tick. Clinic load. Maintain overnight." |
| 11 | Buy Improved Chronometers | Accepted: "Station clock running slow. Each lost second is output not delivered. Correct it." |
| 12 | Run 5 kinds of part at once | Accepted: "Inspection due. Present a plant, not a pile of fuel." |
| 13 | Have 10 Capacitors | Accepted: "Winter reserve required. Cold nights. Store output." |
| 14 | Make 500 power per tick | Accepted: "Output required: 500 per tick. Rail yard load, replacing diesel." |
| 15 | Upgrade Potent Uranium Cell to level 3 | Accepted: "Uranium stock weak. Raise its rating." |
| 16 | Auto-sell 500 power per tick | Accepted: "Co-op load, sold off the line. 500. Continuous." |
| 17 | Run 5 Quad Plutonium Cells | Accepted: "Second valley connected. Plutonium required." |
| 18 | Fill every tile in the reactor | Accepted: "Every empty slot is a house on candles. Fill them." |
| 19 | Run 5 Quad Thorium Cells | Accepted: "Thorium delivery: Tuesday. Install on arrival." |
| 20 | Have $10B | Accepted: "Reserve required: $10B. Hold it." |
| 21 | Run 5 Quad Seaborgium Cells | Accepted: "Three towns on this grid. If the station trips, all three go dark." |
| 22 | Make 10 Exotic Particles | Accepted: "Accelerator installed. Particles required: 10. Use: not stated." |
| 23 | Make 51 Exotic Particles | Accepted: "Particles required: 51. Break room reassigned." |
| 24 | Reboot the reactor (Experiments) | Accepted: "Shut down. Rebuild the core. Restart." |
| 25 | Buy research (Experiments) | Accepted: "Particles are for research. Spend them." |
| 26 | Run 5 Quad Dolorium Cells | Accepted: "Dolorium required. Candles: no longer remembered." |
| 27 | Make 1K Exotic Particles | Accepted: "Particles required: 1,000. Reason: not required." |
| 28 | Run 5 Quad Nefastium Cells | Accepted: "Nefastium. Signed for twice." |
| 29 | Place an experimental part (Exotic) | Accepted: "Crate received. No manual. Install." |
| 30 | Nothing left on the list | Accepted: "Demand met. All listed loads supplied. Maintain output." |

- **Requests that grow** (3.5: "request 200 power then cancel and make it 300"),
  built and accepted. Three jobs are cancelled the first time they are met and
  asked again at half as much more, once: job 14 (500 power a tick, then 750),
  job 20 ($10B, then $15B) and job 27 (1,000 particles, then 1,500). One in the
  work orders, two in the demands: more often as the demand grows. The first
  order is not paid; the raised one pays what the first would have. A target
  that moves says it moved (1.5): the goal line flashes *Revised*, the log book
  files the line below, and the job's row keeps its first note with the
  revision under it. Past job 30 a **standing order** stands: always a round
  figure above what the reactor makes when it is issued, never lower than the
  one before, kept through a reboot, and paid nothing (the output sells as it
  always has). Records counts the orders met. The lines:

| Where | Accepted |
| --- | --- |
| Job 14, revised | Accepted: "Order revised. 500 cancelled. Output required: 750 per tick." |
| Job 20, revised | Accepted: "Order revised. $10B cancelled. Reserve required: $15B." |
| Job 27, revised | Accepted: "Order revised. 1,000 cancelled. Particles required: 1,500." |
| Goal line, past job 30 | Accepted: "Increase output to \<figure\> per tick" |
| Log book, each order issued | Accepted: "Increase output: \<figure\> per tick. Reason: not required." |
| The last job's row | Accepted: "Standing order: \<order\>. Met since the log closed: \<n\>." (the order in the goal line's words) |

- **The plant computer** (4.3, 5.5), built and accepted: the Upgrades and
  Experiments pages are one terminal's two screens. Teal plating, a cream plate
  with an orange rule (the lead reference's white panel and orange line), a dark
  phosphor screen, a lamp lit in the price's colour while anything is within
  budget. A tap still buys one level. The lines:

| Where | Accepted |
| --- | --- |
| The plate | Accepted: "Plant computer" and "Maintenance" / "Research" |
| The prompt, Upgrades | Accepted: "Maintenance. Budget: $\<figure\>." |
| The prompt, Experiments | Accepted: "Research. \<figure\> EP available." |
| The prompt, after a purchase | Accepted: "Authorised: \<upgrade\>, level \<n\>." (a single-level upgrade drops the level) |

- **The rewrite rule:** every generic system string is rewritten in voice, or
  kept plain on purpose, with the reason. These are in the build today in a
  default voice:

| String | Where | In voice, or plain on purpose? |
| --- | --- | --- |
| "Save exported" / "Save imported" | `www/js/main.js` | Accepted: "Station record written to file." / "Station record loaded." |
| "Copied" | `www/js/ui.js` (layout codes, records) | Accepted: plain on purpose; a button's state, one word |
| "\<part\> unlocked" | `www/js/ui.js` | Accepted: "Supplied: \<part\>." (the supplier on record: "Supply sent Dual cells by mistake") |
| "New in the dock: ..." | `www/js/ui.js` | Accepted: "Supplied: \<part\>, \<part\>." (the same form) |
| "Modules unlocked - design one on the Modules page" | `www/js/ui.js` | Accepted: "Casing design authorised. See Modules." |
| "Trophy: \<name\>" / "Field note: \<name\>" | `www/js/ui.js` | Accepted: "Entered in the record: \<name\>." / "Field note filed: \<name\>." |
| "That file is not a Reactor Revived save this version can read" | `www/js/main.js` | Accepted: "File rejected. Not a station record this build can read." |
| "Restart the reactor" (the meltdown button) | `www/js/ui.js` | Accepted: "Begin start-up" |

### 7.6 Sensory Palette

A hard spec for anyone making art or sound, human or tool. Filled from Phase 5,
beside what already ships.

| | On record (the build today) | From the interview (the spec) |
| --- | --- | --- |
| Part art | Reactor Revival's 128x128 sprites, stored at 64px and 32 colours; a dock part drawn at 31px | 16x16 pixel art, "dense and intentional" (0.4). 2D, never 3D; never over-greebled; never generic factory parts, only the parts this reactor needs |
| The room | none | A control room left in clean order over a failing core (5.1). Cold, industrial, mildly musty |
| Materials | steel ramp, bevelled frames, checker grain, recessed slot | Soviet off-colour plastics; teal and orange metal plating; tactile switches, knobs, valves, mechanical controls, manual overrides (5.2) |
| Colours | ink `#c8d3de`, dim `#7b8794`, power `#58c470`, heat `#d8703a`, cash `#d8c15a`, particles `#b06fd8`; each fuel its own glow | A pale panel with a process diagram in orange, blue and black (5.6, lead reference); teal and orange plating. Colour that carries a signal is allowed; bright, glossy decoration is not (6.1) |
| Light | the board warms toward red with heat; grey until abnormal | The player's real time (5.3). By day, flat grey light through fog; by night, the room's own lamps. Any shading stays out of the heat colours |
| Outside | none | Fog, overcast, dreary, a chill: "the dreary outside essence" (5.1, 5.6) |
| The valley outside | four paintings behind the board, one per season (`www/backdrops/`) | The designer's own paintings for Reactor Revival, in the manner of Simon Stålenhag: fog, flat grey light, green country, old plant standing in it. Still; faint through the empty slots; gone near the limit |
| Reference images | none | Four photographs (5.6); the lead is the white panel painted with its process in orange, blue and black, with round dials and a desk of black levers. Found by image search; sources unknown, so reference only: never stored, traced or shipped |
| Signature sounds | one hum; six heavy, dull impacts | The click and clank of placing and moving parts: "the physical weight, the effort of your actions, the heaviness of the situation" (5.4) |
| The quietest sound | the hum at Mark I | The click and clank of a part going into place (5.4) |
| Button feel | a heavy drop; a flash with no sound when refused | One tap, heard as a two-stage click-clack; slow in feel, never in speed (5.5). Built for the plant computer: an upgrade is a key pressed through, inverse video while held, a click then a clack (5.5). Other presses are still one sound |
| Automated systems | Heat Control Operator switched on the Upgrades page; auto-sell and perpetual rebuys with no light or switch | Each has a light and a switch the operator can see from the reactor (5.2) |

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
- that the operator is human (4.1; placed by the designer: "operator is human")
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
- why a Soviet-built reactor stands in an English valley (6.3)

Placed after the Lock: **who kept the key.** Nobody: "the key was left in the
lock by the last operator". A known truth, said in the notice found in the
desk (`suspension`): the operator of record retired, and its last line reads
"Operator key: left in the lock." The first job's "present and turns freely"
is the same key. Added at the designer's request. Nothing is unplaced.

**The answers, as the letters give them.** Drafted by the interviewer to fit
what the designer had placed, and accepted by the designer ("accept the
letters"). *Provenance:* the interviewer's words, chosen by the designer.
Letters that state them are the canon; a later line may deepen one, never
contradict it.
- **Why it closed:** paperwork, not an accident. The operator of record
  retired, and operation was suspended until a successor was approved (`suspension`).
- **Why the approval never comes:** the Director of Appointments' post is
  vacant, and appointments to it are made by the Director of Appointments (`director`).
- **Why operators are scarce:** the vacancy has been posted weekly for eleven
  years, pay above scale, with one application: the operator's (`vacancy`).
- **The Soviet reactor:** bought under an export agreement and assembled from
  crates; the other party no longer exists, and parts are still made to its
  drawings. The start-up guide is a translation, which is why the log's manual
  sections stop after Section 4 (`drawings`, `export`).
- **The valley's people:** registered units, with a task list and a load each
  (`unregistered`, `works`); suspected first from a clockkeeper who has never
  taken leave (`clock`). Left open on purpose: the night nurse who no longer
  needs a torch, and the courier who opens the letters and came when there was
  nothing to deliver (`torch`, `continue`, `courier`).
- **The operator:** human, placed by the designer ("operator is human"). Not a
  registered unit, and so outside the approval that kept every unit away,
  which is how a human could start the plant when no unit could
  (`unregistered`).
- **The demand:** the works turn out units on a schedule nobody has revised, and
  each new unit is issued a load (`works`).
- **The particles and the last crate:** the university's programme, set by a
  Faculty that has not met since, aims at a reactor that runs without an
  operator; the crate holds its first parts, and needs no manual (`programme`,
  `objective`).
- **Nefastium:** made at the university's accelerator from the particles sent
  there; receipt takes two signatures, and with no supervising officer the
  operator signs for both (`signatures`).
- **Settled with the letters:** 4.1 says only the power is noticed, and 2.6
  says every mystery is answered, including what the operator is. One form
  letter notices the operator as a record, never as a person; the designer
  accepted it with the rest. No other line may notice the operator.

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

**The pillar's self-test, judged** (One Request, Waiting, 7.2). Recommended by
the interviewer; accepted by the designer:

| # | What | Verdict |
| --- | --- | --- |
| 1 | The dot on the goal line marking an example layout waiting in the log | Keep, with a ledger entry: it sits on the one request's own line and points at help inside the game (6.3) |
| 2 | Unlock toasts: parts supplied, new dock parts, casing design authorised | Change: a silent entry in the log book; the part still appears in the dock |
| 3 | Trophy and field note toasts | Change: filed silently in the log book and the record |
| 4 | The toast that closes a Time Flux run | Keep, with a ledger entry: a receipt of what happened while away (1.5) |
| 5 | The welcome-back toast ("Away 3h - banked as Time Flux") | Change: shown on the Time Flux gauge in the header |

## After the interview

1. File the answers in this document, verbatim.
2. Put the Soul Sentence, the atmosphere pillar and any changed standing rule
   into the soul instance, with ledger entries for anything that bends
   Containment. **Done:** the soul instance, [soul.md](soul.md) and the README
   carry them, and the bends are ledgered.
3. Rewrite the strings in 7.5 and settle every row in 7.3 in one pass, then
   extend `test/guide.test.js` to hold the Never List's text rules (no
   exclamation marks; the banned phrasings) over every string the player reads.
   **Strings done:** the thirteen accepted rewrites and the Soul Check's toast
   verdicts are in the build. Parts supplied, casing designs, trophies and field
   notes are filed silently in the operator's log book; the welcome-back toast
   is gone and the Time Flux gauge shows the bank; the "unlock" and "goal"
   sounds are retired. `test/voice.test.js` holds every accepted string to the
   build and keeps exclamation marks out of what the player reads. The rows in
   7.3 marked Mechanic or Letters are still to build.
4. Re-run the Seed Card (Phase 0 of the soul instance) against 1.3 and 1.4. The
   inferred fortieth minute and next-day story are replaced by the designer's.
