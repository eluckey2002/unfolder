# Interview transcript — Marcus
Date: 2026-05-16 (synthetic)
Interviewer: UX researcher (neutral, evidence-seeking)
Interviewee: Marcus, 34, Halo-helmet cosplay builder; software QA engineer; builds 2–3 full armor costumes a year out of a basement workshop.

## Section 1 — Warmup

**Interviewer:** Tell me a bit about yourself — what you do, where you live, what kind of stuff you make.

**Marcus:** Sure. I'm Marcus, 34, I live outside Portland. Day job is software QA — mostly automation, some manual exploratory stuff. Nights and weekends I'm in the basement building cosplay armor. Mostly Halo — I've done three different Master Chief suits over the years, a couple of ODST helmets, and last summer I did a Mandalorian commission for a friend's wedding, which sounds like a joke but isn't. Two to three full builds a year, plus odd props in between.

**Interviewer:** How did you get into papercraft?

**Marcus:** Through the 405th forum, like everyone. Back in 2020 I wanted a Master Chief helmet, found a Pepakura file someone had posted, and just… started. I didn't even know "pepakura" was a word. I printed it on regular paper the first time and the whole thing collapsed when I tried to fiberglass it. Lesson learned. I switched to cardstock, then eventually to using the pep as a template for EVA foam, which is what I do now.

**Interviewer:** How often are you making something?

**Marcus:** There's always something in progress. A full helmet from "I downloaded the file" to "it's on the shelf with paint" is maybe 40 to 80 hours of actual work, spread over a few months of evenings. So at any given moment there's a thing on the bench. Right now there's a half-finished ODST shoulder pauldron staring at me.

## Section 2 — Most recent project, end to end

**Interviewer:** Tell me about the most recent papercraft thing you finished. Walk me through it.

**Marcus:** Most recent finished thing was a Master Chief Mark VI helmet I built in March. Commission for a guy in Seattle. The model came from the 405th file archive — there's a guy named Moesizzlac who's done the canonical Mark VI unfolds for like ten years, and I started with one of his `.pdo` files. But I never trust the original creator's unfold. Ever. Even his.

**Interviewer:** Why not?

**Marcus:** Because what works for one builder doesn't work for another. The original unfold optimizes for fewest pieces. That's the Pepakura default and most people just accept it. But "fewest pieces" and "buildable" are not the same thing. So I open the `.pdo`, I delete all the existing fold lines, and I re-unfold it myself. Takes me two to four hours for a helmet, depending. The Master Chief one took maybe three hours of just unfolding before I printed anything.

**Interviewer:** Walk me through what happens in those three hours.

**Marcus:** I look at the 3D model, I figure out the natural seams — the chin strap section is its own piece, the back of the dome is its own piece, the visor surround is its own piece. Then I start joining faces. Pepakura has a "join faces" tool but it's clunky. You click adjacent triangles and it merges them into a strip. The trick is knowing *when to stop joining*. If I join one face too many, suddenly the piece has a fold line running across a curved surface and the whole panel won't lay flat on foam. I split it back. Then I look at the next one. It's tedious. It's like sudoku. Once you've done a dozen helmets you can see it, but you can't *say* it.

**Interviewer:** What part frustrated you most on that build?

**Marcus:** The unfolding itself, honestly. Not the cutting, not the gluing, not the foam work — I'm fast at all of that now. It's the three hours of clicking in a Windows-95-looking app on a VM on my Mac because the only good tool runs on Windows only. Every time I switch from Sketch on Mac to Pepakura on Windows I die a little. And the worst part is, three hours in, I've made a thousand tiny decisions and there's no version history. If I made a wrong call on piece 12, I'm not going back.

**Interviewer:** What part was fun?

**Marcus:** Cutting the foam from a clean template is meditative. I put on a podcast, sharp blade, good template, you just go. That's the payoff. And the moment when you've got the whole helmet held together with hot glue for the first time and it actually looks like a Master Chief helmet — that's the moment. That's why I do this.

## Section 3 — Tools and workflow

**Interviewer:** What software do you use in this process?

**Marcus:** Pepakura Designer is the workhorse. It's the only thing I use to unfold. Then Inkscape on the Mac for tweaking the print layout sometimes — adding fiducials, labeling pieces. Photoshop for reference images. That's basically it.

**Interviewer:** When did you first try Pepakura, and how did that go?

**Marcus:** 2020. The UI is from approximately 1997. It's MFC, Windows-only, it doesn't respect any modern conventions — no proper undo stack, scroll wheel zoom is broken half the time, the toolbar icons look like they were drawn in MS Paint. But the *unfold engine* is good. The actual mesh-flattening math works. So you put up with the interface because the output is correct.

**Interviewer:** Has there been a tool you wanted to use but bounced off?

**Marcus:** Yeah. I tried Blender's Export Paper Model add-on maybe a year ago. The pitch is great — it's free, it runs on Mac, it does unfolding. I spent an afternoon on it. The problem is Blender. To do anything in Blender you have to learn Blender, and Blender's UI has like 400 keyboard shortcuts. I do this once a month. I'm not going to memorize a flight simulator to make a helmet. I bounced.

**Interviewer:** If you drew your workflow on a whiteboard, what would the boxes be?

**Marcus:** Box one, find or buy a 3D model. Box two, clean it up if it's high-poly — sometimes that's a Blender decimate, sometimes it's MeshLab. Box three, import to Pepakura. Box four, re-unfold from scratch. Box five, lay out and print on cardstock. Box six, cut and assemble cardstock into a rough shell to check fit. Box seven, transfer the patterns onto EVA foam. Box eight, build the foam armor. Box nine, seal, prime, paint. The first four boxes are all on the Windows VM and I hate it.

## Section 4 — Pain probes

**Interviewer:** Tell me about a time a model came out wrong.

**Marcus:** Oh, the Sketchfab dragon. Two years ago I wanted to make a wall-mounted dragon head for my kid's room. Found a free model on Sketchfab, looked beautiful, imported it to Pepakura, and Pepakura chewed on it for like 20 minutes and spat out 287 pieces. Two hundred and eighty-seven. Some of them were a single triangle. I tried to decimate the mesh down, that made the silhouette ugly, I tried again, still 180-something pieces. I gave up. Hung a poster of a dragon in his room instead. He didn't notice. That was the last time I tried anything from Sketchfab.

**Interviewer:** When you print a sheet and start cutting, are you ever surprised by what's on it?

**Marcus:** All the time. Tabs are the big one. Pepakura puts tabs wherever it wants, and probably one third of the time the tab ends up on what'll be a *visible* edge of the finished piece. So I'm cutting and I realize, oh, this little flap is going to be glued onto the outside of the cheek, where everyone will see it. I either flip it manually in Pepakura — which is another click-click-click thing — or I just cut the tab off and glue the seam edge-to-edge, which is weaker.

**Interviewer:** Have you ever wished a piece were split differently than the tool gave you?

**Marcus:** That's literally the entire reason I re-unfold every file. Every single time. The classic example: on a Mandalorian chest plate I did a couple years ago, Pepakura wanted to make the whole front breastplate one big piece with a fold line running right down the sternum. Beautiful in theory. Impossible to wrap onto curved foam because the fold doesn't sit on a natural curve transition. I split it into a left half and a right half meeting at the sternum, and suddenly it just worked. Took me ten minutes to fix and three weeks of guilt that I hadn't done it sooner.

**Interviewer:** How do you handle the tabs?

**Marcus:** Reluctantly. For cardstock-as-foam-template I mostly don't even glue the tabs — I just use them to hold the rough shape together with painter's tape long enough to confirm the fit, then I cut the foam without tabs. But for anyone doing actual paper armor, tab placement is brutal. There's no "hey tool, never put a tab on this edge" option. You move them one at a time.

**Interviewer:** When it's assembled, what does it usually look like?

**Marcus:** My foam builds are clean — you can't see seams once they're heat-sealed and painted. But when I do a pure cardstock build, like a test fit, every seam shows. That's fine for a template; it'd be a problem if I were doing it as final armor.

## Section 5 — Edit and undo behaviors

**Interviewer:** Once a model is unfolded, do you ever change anything before printing?

**Marcus:** Constantly. Piece numbering, piece grouping onto sheets, scale verification, removing the tabs on edges where I know I want to butt-join. And I always — *always* — split out the interior helmet padding pieces onto a separate sheet from the exterior pieces. Right now Pepakura has no concept of "this piece is inside the model." I just manually drag pieces around in the layout view until the inside-pieces are on their own page. Every time. For every project.

**Interviewer:** Have you ever undone something in a papercraft tool? Did undo work the way you expected?

**Marcus:** Ha. Pepakura's undo is… selective. It undoes some things and not others. It will undo a join, but it won't undo a layout move, I think? Or maybe the other way. I never know. So I save constantly. Save, save, save. Like I'm in vim from 1995.

**Interviewer:** Do you save in-progress unfolds or start fresh?

**Marcus:** I save aggressively to `.pdo` files with version numbers in the filename — `chief_v3.pdo`, `chief_v3b.pdo`. Because I don't trust the tool's history.

## Section 6 — Assembly help

**Interviewer:** When you're assembling, how do you keep track of which piece goes where?

**Marcus:** Piece numbers on the printout, and I keep the 3D view of the model open on a second monitor while I build. The number on each tab tells me which other piece it mates with. That mostly works.

**Interviewer:** Do you ever lose your place?

**Marcus:** Sure. Usually when I leave a build for a week and come back. I find a piece on the bench with no obvious mate, and I have to go back to the screen, rotate the model, find the equivalent face, and figure out where it lives. The 3D model on screen is the source of truth — the paper printout alone wouldn't be enough.

**Interviewer:** Anything else besides the printout and the 3D view?

**Marcus:** Reference photos. Lots of them. For Halo there are screen captures, official renders, other people's builds on 405th. I have a Pinterest board per project. The papercraft template tells you geometry; the photos tell you what "right" looks like.

## Section 7 — Magic wand

**Interviewer:** If a software fairy could give you any one feature for your next build, what would it be?

**Marcus:** A buildability score per piece. Color-coded, red-yellow-green, with a one-line reason. Like, "this piece is red because it has four acute interior angles," or "this piece is red because the longest edge is over 18 inches and won't fit on letter paper." Right now I rely on six years of intuition to look at a piece and know if it's going to give me trouble. I can do it — I can't *teach* it. I tried to mentor a guy on 405th and I literally could not put into words what I was doing. A score would mean a beginner could look at the same unfold I'm looking at and *see* the problem pieces.

**Interviewer:** What's the silliest, most over-the-top thing you'd want?

**Marcus:** AI that watches my last fifty builds and learns my preferences. "Marcus always splits the chin strap from the jawline. Marcus always puts the interior padding on its own sheet. Marcus prefers tabs on inside edges." Then it unfolds the next model the way I would have. Five seconds, done. I know it's not realistic. But that's the magic wand.

Oh, and: runs in a browser. On the Mac. Without a VM. That alone would change my life.

**Interviewer:** If unfolding software disappeared and the perfect PDF just appeared, would you miss anything about the current process?

**Marcus:** Honestly? No. The unfolding step is not the fun part. The fun part is the foam, the painting, the moment it's done. If a perfect PDF appeared from the void, I'd thank the void and get to work. I can imagine, *maybe*, missing the feeling of really understanding a model by having unfolded it myself. There's a craft knowledge in there. But I'd trade it.

## Section 8 — Cool-down

**Interviewer:** Anything I should have asked that I didn't?

**Marcus:** You didn't ask about cost. Pepakura Designer is like forty bucks for the version that lets you export, which is fine, I've paid it. But the bigger cost is the Windows machine. I have a license for Parallels and a Windows VM I keep around basically just for Pepakura. If a Mac-native or browser tool existed I would pay real money for it.

**Interviewer:** Anything you want to make sure is in the notes?

**Marcus:** Two things. One, the people doing this for real — the 405th regulars, the RPF folks — every single one of them re-unfolds. Every one. The "default" unfold is for beginners, and even beginners outgrow it in their second build. Whatever you're researching, don't assume the auto-unfold is the product. The *editing* of the unfold is the product. Two, none of us are in this for the paper. We're in it for the armor, or the prop, or the cosplay. Paper is a means to a template. If you remember that, you'll build the right thing.

**Interviewer:** Thank you, Marcus.

**Marcus:** Anytime.
