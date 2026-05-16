# Interview transcript — Dan
Date: 2026-05-16 (synthetic)
Interviewer: UX researcher (neutral, evidence-seeking)
Interviewee: Dan, 41, middle-school history teacher who builds tabletop wargame and D&D terrain in his garage

## Section 1 — Warmup

**Interviewer:** Tell me about yourself — what you do, where you live, what kind of stuff you make.

**Dan:** I teach eighth-grade U.S. history outside Columbus, Ohio. Married, two kids, dog, the whole bit. The making part — I build tabletop terrain. Buildings, ruins, walls, watchtowers. I run a weekly D&D game in my basement and a Bolt Action group at the FLGS once a month, so I'm always feeding the table. Right now my garage table has about thirty pieces of a Tudor castle complex spread across it. I'm three months in. There's drying glue everywhere and my wife has stopped commenting.

**Interviewer:** How did you get into papercraft?

**Dan:** Pure economics. Around 2018 I priced out a Games Workshop terrain set — I think it was the Sector Mechanicus stuff — and it was just stupid. Like, three hundred dollars for what is, fundamentally, plastic boxes. I'd been printing classroom maps on cardstock anyway, and a buddy at the game store showed me a PDF terrain pack from DriveThruRPG — five bucks, six buildings. I printed it that night and I was hooked. The kids think it's cool too, so I get to write it off as enrichment.

**Interviewer:** How often do you make something?

**Dan:** Realistically? I'm at the craft table three or four nights a week, an hour or two after the kids are down. So I'm always mid-build. Finished pieces — maybe two a week if it's a good week. The Tudor complex is forty buildings when it's done, and I'm probably halfway.

## Section 2 — Most recent project, end to end

**Interviewer:** Tell me about the last papercraft thing you built. What was it?

**Dan:** Last *finished* piece was a Norman keep — a square donjon with corner turrets, about eight inches tall on the table. Part of the castle complex. Took me about a week of evenings.

**Interviewer:** Walk me through it from "I want to make this" to "it's sitting on my shelf."

**Dan:** Okay. So the castle complex — I bought the base pack from a designer on DriveThruRPG, but he didn't have a Norman keep in the line. He had a square tower and he had turrets but not the combo. So I opened Blender and kit-bashed one — took his tower, scaled it, added four corner turrets, fixed the roof geometry. That part was maybe two hours, because architectural stuff is just boxes, I'm fast at it.

Then the unfolding. I exported the OBJ, pulled it into Pepakura Designer, and let it auto-unfold. That gave me a starting point but the layout was — it's always the same problem. Pepakura spreads pieces across like seven sheets when it could've been five if I rearranged. So I spent an evening, maybe an evening and a half, dragging pieces around the virtual page, rotating them ninety degrees, packing them tighter. I'm doing the bin-packing the software should be doing.

Then I printed it — color cardstock, 110-pound, on my Brother laser. The keep ended up at 47 sheets when all was said and done, after I added the courtyard wall sections. Cut it out with a hobby knife and a metal ruler, scored the folds with a dead ballpoint, glued it up over three or four evenings. Tacky glue, not super glue — gives you wiggle room. Now it's on the shelf in the garage waiting for its turn on the table.

**Interviewer:** Where did the model come from? You said you kit-bashed it — was that typical?

**Dan:** Maybe a third of the time. Two-thirds I'm using somebody's PDF straight. But when I want something specific — a Norman keep, a half-timbered guard house, a particular gatehouse layout — yeah, Blender. I've been in Blender since like 2015. I taught myself by following BlenderGuru and I've written a couple Python addons for classroom stuff, so I'm not scared of it.

**Interviewer:** When you unfolded it yourself — what frustrated you most?

**Dan:** The tabs. Always the tabs. Pepakura picks which side of an edge gets the tab, and it picks — I think it's somewhat arbitrary, honestly, maybe based on edge length. So I end up with glue tabs sitting on the *outside* of the keep wall, where you can see them under the paint. I want every tab on the *inside* of the building. Always. Because nobody's looking inside a closed terrain piece.

I actually tried, last fall, writing a Blender Python script to auto-place tabs on the inside of the mesh. The idea was: compute the dihedral angle, figure out which side faces outward, put the tab on the inside face. I got partway through it and the dihedral check got gnarly — for a closed mesh it's straightforward, but for half-walls and ruins with open edges it falls apart, and a lot of my terrain has open edges. I gave up after maybe six hours. Went back to manually flipping tabs in Pepakura, one at a time, for the keep. That alone was probably an hour and a half on the keep.

**Interviewer:** What part of the process took longest?

**Dan:** Layout. Hands down. The Pepakura auto-arrange uses something like 30% of each sheet as whitespace, and at color-laser pricing — I pay about twelve cents a sheet between toner and cardstock — every wasted inch is real. Over a 40-building project that adds up to real money. So I rearrange, and rearranging the keep took about an evening. The whole castle complex layout, when I tried to do it all in one pass, took me two evenings, and I gave up partway and just did it building-by-building.

**Interviewer:** What part was actually fun?

**Dan:** Cutting and gluing. Hand-on-the-craft-knife, podcast in the ear, gluing up a building you can hold. That's why I do this. The Blender and Pepakura part is the tax I pay.

## Section 3 — Tools and workflow

**Interviewer:** What software do you use as part of papercraft?

**Dan:** Blender for modeling. Pepakura Designer for unfolding — I bought a license in 2019, I think. Inkscape occasionally if I need to tweak a PDF or add a texture overlay. That's it. I've looked at a couple of other unfolders over the years but I bounced off all of them.

**Interviewer:** When did you first try Pepakura? How did that go?

**Dan:** 2018, right after I got into papercraft. The learning curve wasn't bad — the UI is dated but the model is simple enough. What got me was that I assumed it would do the layout job *for me*, and it doesn't. It does a layout, but it's not the layout I want, and you can't really tell it what you want. You just drag.

**Interviewer:** Has there been a tool you wanted to use but bounced off?

**Dan:** Yeah, a couple. There was an open-source unfolder a couple years back — I forget the name, ran in the browser, I think. I tried it for a half-timbered house and it crashed on my mesh, something about non-manifold edges, even though Blender said the mesh was clean. Lost an evening to that. And I've looked at the Blender built-in paper-model addon and it's just — it doesn't give me control over tab placement either, and the layout is worse than Pepakura's.

**Interviewer:** If you had to draw your workflow on a whiteboard, what would the boxes be?

**Dan:** Box one: find or model. Either I'm browsing DriveThruRPG or I'm in Blender. Box two: unfold — Pepakura. Box three, and this is the big one: *fight the layout*. Move pieces around the page, rotate them, repack. Box four: fix tabs. Manually flip every tab that's on the wrong side. Box five: print. Box six: cut, score, glue. That's the box I actually enjoy. Box seven: paint and weather. Also fun. So two fun boxes, four chore boxes.

## Section 4 — Pain probes

**Interviewer:** Tell me about a time a model came out wrong.

**Dan:** Yeah. Earlier this year, a watchtower. I had a tall narrow tower — six-sided, conical roof. Pepakura unfolded it and put the conical roof flat across two sheets because it couldn't fit on one. I didn't catch it before printing. When I assembled it the seam between the two sheet-halves of the cone was *right* on the front face of the tower. Right where you'd look at it on the table. Painted over it, but you can see it. Didn't redo it — I had eleven more towers to build. But I was annoyed. If I'd known the seam was going to land on the visible face I'd have rotated the piece before printing.

**Interviewer:** When you print a sheet and start cutting, are you ever surprised by what's on it?

**Dan:** All the time. Sometimes Pepakura splits a wall section across two sheets when it would've fit on one if rotated. Sometimes it merges pieces from two different buildings on the same sheet — which is *terrible* for me, because my whole batching system depends on cutting all of one building at once. I'll be cutting the Tudor merchant house and find half a barn on the same sheet. So now I have to set the barn piece aside, label it, and hope I find it again next month when I get to the barn. It breaks my flow completely.

**Interviewer:** Have you ever wished a piece were split differently than the tool gave you? Or merged?

**Dan:** Yes — usually merged. Pepakura will sometimes split a big wall into two strips when it would print fine as one. And on the cone-roof thing, I wanted it split *differently* — split along the back, not the front. The tool gave me no easy way to say "cut here, not there."

**Interviewer:** How do you handle the tabs / glue flaps?

**Dan:** Pepakura assigns them; I flip every tab that's going to end up visible. For a building with, I dunno, sixty edges, I'm flipping maybe fifteen or twenty tabs. It's mind-numbing. And there's no way to say "this face is the outside; never put a tab on its edge." If I could mark faces as "visible exterior" once, in Blender or wherever, and have that *follow the mesh* through to unfolding — that would change my life.

**Interviewer:** After it's assembled, what does the result usually look like?

**Dan:** Good enough at three feet. That's my standard. These pieces live on a table where players are sitting back two, three feet away, in dim basement lighting. Up close you can see every seam, every tab edge where it bled through. I paint and weather to hide it. But at three feet, my Tudor village reads like a Tudor village. That's the bar.

## Section 5 — Edit and undo behaviors

**Interviewer:** Once a model is unfolded by software, do you ever change anything before printing?

**Dan:** Constantly. I flip tabs. I rotate pieces. I move pieces between sheets. I sometimes manually split or rejoin pieces. I'd say half my time in Pepakura is *after* the auto-unfold.

**Interviewer:** Have you ever "undone" something in a papercraft tool? Did the undo work how you expected?

**Dan:** Pepakura's undo works for most things — moves, rotations. But if you flip a tab and then move the piece, sometimes undoing the move also undoes the tab flip, which is not what I want. I lost a tab arrangement once that way and had to redo about ten flips. So I save often. Like, every ten minutes. Ctrl-S is a reflex.

**Interviewer:** Do you save your in-progress unfolds, or do you start fresh each time?

**Dan:** Always save. Every project has its own .pdo file. Sometimes I come back to a building six months later because I need another copy for a different table, and I do *not* want to redo the layout work. The .pdo is the artifact, not the printed sheet.

## Section 6 — Assembly help

**Interviewer:** When you're assembling, how do you keep track of which piece goes where?

**Dan:** Pepakura prints little edge numbers — "edge 47 mates with edge 47 on the other piece." It's clunky but it works. For complicated pieces I'll also pull up the 3D view on my iPad next to the craft table — rotate the building, see which face I'm looking for.

**Interviewer:** Do you ever lose your place?

**Dan:** On big builds, yes. The keep had something like 80 pieces. I had to set it down for two weeks once and when I came back I'd forgotten which wall was which. The iPad with the 3D model saved me — I could rotate it and match.

**Interviewer:** Do you use anything besides the printed sheet to assemble?

**Dan:** The iPad, the original Blender file occasionally if I need to check a dimension, and reference photos of the real thing — like, actual Tudor architecture, so I know where to put the trim and what color the timbers should be.

## Section 7 — Magic wand

**Interviewer:** If a software fairy could give you any one feature for your next papercraft project, what would it be?

**Dan:** A "what's visible after assembly" hint. I want to mark or have the software figure out — these faces will be the outside of the building, these faces will be the inside. Once you know that, *everything* falls out. Tabs go on the inside automatically. Color register matters on outside faces, doesn't on inside. Seams get hidden on the back face by default. The cone-roof seam problem disappears. It's the same information I have in my head; I just want the software to share it.

**Interviewer:** What's the silliest, most over-the-top thing you'd want?

**Dan:** Auto-grouping by building, with smart sheet packing that respects the grouping. So I tell it "this is the Tudor merchant house, this is the barn, this is the watchtower" and it packs each one onto its own sheets, tightly, never mixing. And then a "global re-pack" button that says "you've got 30% whitespace; here are three ways to consolidate, pick one." And — okay, while we're being silly — a paper-cost readout. "This building costs $0.84 to print as currently laid out. Rearranging saves $0.23."

**Interviewer:** If unfolding software could disappear entirely and the model just magically appeared as a perfect PDF, would you miss anything?

**Dan:** No. Not one thing. The unfolding step is pure tax. I want a PDF I can print. I do not enjoy any minute of the Pepakura experience. If it were instant and correct, I'd take that deal and never look back.

## Section 8 — Cool-down

**Interviewer:** Anything I should have asked that I didn't?

**Dan:** Maybe — how I handle errata. Like, when a model has a mistake and I find it mid-build. Right now I just patch with extra cardstock and move on. A tool that lets me reprint *just one piece* without redoing the whole layout would also be huge. I think that's adjacent to the grouping thing.

**Interviewer:** Anything you want to make sure is in the notes?

**Dan:** Three things. Cost matters — every wasted square inch of color cardstock is real money over a forty-building project. Tabs need to go on the inside, always, and the software needs to know which side is the inside. And keep my pieces grouped by what they belong to, even if it costs efficiency, because my whole assembly system runs on batches. If a tool nails those three I'll buy it tomorrow.
