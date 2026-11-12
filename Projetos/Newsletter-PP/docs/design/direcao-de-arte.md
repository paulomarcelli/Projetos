# DIRECTION SHEET — Colour chapters
seed 1495645491 · drawn 2026-11-12 · sector culture · tone bold
Brief: Newsletter de um estudante de publicidade (Eduardo Pereira) sobre séries e cultura pop, lidas com olhar de publicitário; cores vivas

| | |
| --- | --- |
| Direction | Colour chapters |
| Hero | Waterline headline |
| Type | Albert Sans |
| Colour | Blue, red, black |
| Sections | intro (Statement tiles) → list (Two-column menu, photo bullets) → about (Inset panel, shaped portrait) → cta (The action tile) → footer (Contact as the headline) |
| Motion | Masked headline |
| Photographs | the "Sky and space" set, as atmosphere |

This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,
and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts
with a stated brand constraint or needs an asset that does not exist, and say why in your report.

The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:
**house rules** (including type no smaller than 13px and body text of 16px or more) → **the direction** (the idea, the composition habits, where the
one accent goes) → **the type system and the palette** (which face does which job, the five size steps, which colour is the ground and where the
accent goes) → **the hero blueprint** → **the section blueprints**. Under each blueprint below, "Adjusted for this page" lists where it disagrees.
In practice: take geometry from blueprints (columns, proportions, what sits where) and take everything else from above them. Map every size a
blueprint names onto one of your five type steps instead of adding a sixth. Use one button shape, one corner radius and one pair of page margins on
the whole page, whatever individual blueprints say. If a blueprint names a kind of typeface (a light serif, a heavy grotesk), use the dealt face.

## 1. The idea
Every section is a chapter with its own flat colour, floor to ceiling. The page reads like a set of posters hung in a row, held together by one typeface and one grid. The colours are not decoration: they come from the subject (the brand's packaging, the artist's record sleeves, the product's own colour ways, the categories of the content) and each chapter's colour means that chapter. Decide the sequence like a designer orders a book: a strong opener, a quiet second, a surprise in the middle, a dark or very light closer.

Before anything else, write one sentence in your notes: "On this page, <the subject's own material> becomes <the device>."
Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its
constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category's, not the client's.
Then name the one live thing the visitor can do on the page (SKILL.md step 4).

## 2. Composition
Sections are full-bleed fields, each at least 90svh tall, butted directly against each other with no gap and no divider. Inside every field the same 12-column grid and the same margins apply, and each field holds one thing: a huge heading (8–12vw) with a small paragraph, or one photograph with a caption, or one list. Text colour is chosen per field for strong contrast (ink or paper, never grey). Headings start on the same left edge in every chapter, so the eye feels the system as colours change. The navigation and the footer take the colours of the first and last chapter.

## 3. Type — Albert Sans
A geometric grotesque with Scandinavian restraint: round letters, even colour, nothing decorative. Suits logistics, health, property and corporate sites that need to look clear and dependable.
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```
- Display: **Albert Sans** — weight 600 · tracking -0.035em · leading 1.0 · sentence case
- Text: **Albert Sans** — 400 for body, 500 for emphasis · leading 1.5 · tracking 0
```css
:root {
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);
  --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
  --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);
  --step-head: clamp(2rem, 1.3rem + 3.2vw, 4rem);
}
```
One typeface in two weights. Headings very large and tight; body 18–20px. Because colour is loud, the type stays plain: no italics, no second face.
The direction decides sizes and how many of them; the type system decides how this face is set. Where the two give different tracking or leading, use the values of the type system: they are tuned to this face.
The display size itself comes from the hero blueprint below.

## 4. Colour — Blue, red, black
```css
:root {
  --bg: #ffffff;
  --surface: #f3f3f3;
  --ink: #0a0a0a;
  --muted: #6b6b6b;
  --accent: #2436ff;
  --accent-ink: #ffffff;
  --field-1: #2436ff;  --field-1-ink: #ffffff;
  --field-2: #ff3b1f;  --field-2-ink: #0a0a0a;
  --field-3: #0a0a0a;  --field-3-ink: #ffffff;
  --field-4: #050a5c;  --field-4-ink: #ffffff;
}
```
Three flat poster colours each own whole sections: electric blue, red-orange and black, with white for the areas that show the product. No tints sit between them, and blue is the button colour on white.
Four to six flat fields used at full strength, one per section, each with its assigned text colour. No tints, no gradients between them: the hard edge where two fields meet is the look.

## 5. Imagery
**The project has no photographs of its own yet.** First choice: **real pictures of the subject's world from the open collections**: its city and street in old postcards and photographs, an old map of the neighbourhood, its materials up close, its trade in engravings, museum objects of its kind (references/imagery.md §3). Start with `node /home/user/Projetos/.claude/skills/design-skills/skills/taste-skill/scripts/assets.mjs "estudante publicidade"`, then queries from your inventory (its street, its materials, its trade's tools and history). Download what you use into the project with `--get` and credit every one on the page (`--credits` prints the footer line). They show the world around the client, never the client's own room, dish, product, person or team. Second, for what no honest picture exists of: draw the subject's own things in code, large, in one flat graphic language and the palette's real colours (its tiles, its windows, its objects; references/imagery.md §8). Third: the dealt photographs, only where an honestly generic picture fits (the sea, the weather, a material), never one a visitor could take for the thing itself and never an unrelated scene. One treatment for all of them. If this direction is built on photographs, plan the set before building (four to six pictures of one family) and reuse them at different crops and scales instead of finding or drawing a new picture for every slot; keep drawings as `<symbol>` + `<use>` or generate them with a small script so the page stays light. List every found picture (with its source and licence), every dealt photograph and every drawing that stands in for photography in your report.

Sparing. One photograph or object per chapter at most, either cut out and sitting directly on the colour, or a plain rectangle with generous colour around it. Photographs should be simple enough not to fight the field.

**Floor (the inspector checks it):** at least four real pictures on the page, usually six to twelve; SVG drawings do not count. One moving picture where an honest clip exists: `node <skill>/scripts/assets.mjs --video "<query>"`, used as a muted loop with a poster frame. Whatever this direction says about pictures, it is carried out with real ones.

Photographs dealt for this build, from the "Sky and space" set (skies, clouds, stars and night skies)
Order of preference for imagery: (1) the project's own photographs and product shots; (2) images you generate, if an image tool is
available; (3) real pictures of the subject's world found in the open collections (assets.mjs, downloaded and credited on the page);
(4) drawings of the subject in code; (5) these. They are real photographs (Unsplash licence, served by picsum.photos) of places, light and
texture. They are atmosphere, never a stand-in for a specific product, dish, person or interface. List the ones you use in your report so
they can be replaced.
- `https://picsum.photos/id/505/1600/1000` — Tiny silhouetted figure on a dark ridge under a blue and orange twilight sky · dark tone · deep blue, orange, black · calm area: top · native landscape · photo: lee Scott
- `https://picsum.photos/id/967/1600/1000` — Earth's curved horizon with green aurora seen from an orbiting spacecraft · dark tone · emerald green, violet, black · native landscape · photo: NASA
- `https://picsum.photos/id/38/1600/1000` — White cumulus cloud rising against a dark teal sky · mid tone · dark teal, white · calm area: top · native landscape · photo: Allyson Souza
- `https://picsum.photos/id/724/1600/1000` — Green and red aurora glowing above silhouetted pine trees · dark tone · green, magenta, black · calm area: top · native landscape · photo: Nelly Volkovich
- `https://picsum.photos/id/847/1600/1000` — A few birds flying across a pale blue gradient sky · light tone · pale blue, soft white, indigo · calm area: all · native landscape · photo: Andrej Chudy
- `https://picsum.photos/id/654/1600/1000` — Starry dusk sky glowing orange above silhouetted trees · dark tone · deep purple, burnt orange, black · calm area: top · native landscape · photo: Josh Felise
- `https://picsum.photos/id/765/1600/1000` — Night sky fading to an orange glow along a dark horizon · dark tone · midnight blue, burnt orange, black · calm area: top · native landscape · photo: Grant McIver
- `https://picsum.photos/id/869/1600/1000` — Starry night sky above a mountain glowing warm at its peak · dark tone · navy, deep blue, amber · calm area: top · native landscape · photo: Caleb Ralston
The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and
add `?grayscale` to desaturate. Use three to six of them, not all eight. Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).
Other sets that fit this brief: fog-and-quiet, architecture, city-day, city-night — `node draw.mjs --photos <set>` prints one in full; `--photos list` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.

## 6. Hero — Waterline headline
Two flat fields fill the viewport and meet at exactly half height: the upper one paper or white, the lower one a saturated palette colour. No image. The headline is two lines of capitals in a black-weight grotesk at clamp(72px, 9vw, 140px), centred, leading 0.86, about 65% of the viewport wide, positioned so the seam cuts through the middle of the second line. Above the seam the letters take the accent ink; below it they switch to a deep ink, as if under water. Build it with two stacked copies of the headline in the same position (the lower copy aria-hidden), each clipped to its own field with clip-path: inset(), or with mix-blend-mode: difference on a single copy if the colours allow. The wordmark sits top-left and the single action, a solid rectangle in the accent ink, top-right, both on 28px margins; there are no other links. Near the bottom, 40px above the edge, one supporting sentence at 20px is centred in the paper colour on the saturated field. Everything else is empty colour.

On a phone: The same two fields, meeting at 46% of the height. The headline sets at 15.5vw on two lines, filling the width inside 16px margins, the seam still cutting the second line. The wordmark sits top-left and the action top-right as a small solid rectangle. The supporting sentence sits bottom-left at 17px on the saturated field, on up to three lines.
Headline: A blunt statement of 2-4 words in capitals, at most 20 characters, split so each line is one or two words.

Adjusted for this page:
- It names a kind of typeface: use the dealt faces (display Albert Sans, text Albert Sans) and their settings; capitals only where the type system sets them.
- It names colours (white, black): map them onto this palette's roles (ground `--bg`, panels `--surface` and the fields, text `--ink`/`--muted`, the accent `--accent` on the primary action only).
- It blends text with `difference`: over anything but black, white or grey that gives random hues. Use a solid ink chosen for each ground instead.

## 7. Sections, in order
Each is a composition to rebuild with this project's content. Keep the geometry; change the subject. Re-order or drop a
section when the argument of the page needs it (see references/copy.md), never to fall back to a card grid.

### 1. intro — Statement tiles (mosaic)
A board of filled tiles with 8px gaps and 8px outer margins: 12 columns by two rows of 38svh each. Tile A, columns 1–8 across both rows, is the darkest tile and carries a slogan of two to four words in capitals at clamp(64px, 9vw, 132px), leading 0.86, on two lines, set hard against the tile's 20px left padding and bottom-aligned. Tile B, columns 9–12 of row one, is a pale tile with one word or figure at the same size, bottom-aligned, cropped by `overflow: hidden` if it runs long. Tile C, columns 9–12 of row two, is a photograph covering the tile. Below the board a fourth tile spans all 12 columns in the page ground colour: its left half is empty and a text of 90–130 words at 22–24px with leading 1.35 runs in columns 7–12 with 40px padding. No separate heading: the slogan in tile A is the heading.
On a phone: A two-column board with 6px gaps. The slogan tile spans both columns at 46svh with type at 17vw on two lines; the word tile and the photograph tile sit side by side as squares; the long text tile spans both columns with 20px padding at 18px.

Adjusted for this page:
- It names a kind of typeface: use the dealt faces (display Albert Sans, text Albert Sans) and their settings; capitals only where the type system sets them.

### 2. list — Two-column menu, photo bullets (grid)
A menu or catalogue list in which each item has a small cut-out photograph where a bullet would be. Each category opens with its name at clamp(32px, 3.4vw, 50px) at the left margin and the number of items at 16px right-aligned on the same baseline, with 96px above and 40px below. Items then run in two columns with a 64px gutter and 36px between rows. Each item is a two-part row: a 64px photograph of the item on a plain background at the left (multiplied onto the ground with `mix-blend-mode: multiply`, or masked to the page's one shape), then 20px to its right the name in bold at 17–18px with the price right-aligned on the same line, and beneath it a two- or three-line description at 15px in the soft ink, max 38ch. A short note such as an allergen follows the description in the accent ink. No boxes. Holds 6–10 items per category.
On a phone: One column. Photographs shrink to 52px and stay at the left; name and price share the first line with the description beneath at 15px. Category names at 8.5vw with the count on the same baseline. A sticky row of category names as text links lets the reader jump.

### 3. about — Inset panel, shaped portrait (split)
A deep-toned panel inset 20px from the page edges with a 12px radius, about 110svh tall, `overflow: hidden`. Left half: a two-line statement of four to seven words at clamp(40px, 4.4vw, 64px) in a pale ink, top-left with 56px padding; it is the heading and has nothing above it. Below it a photograph of the person or the workshop, masked with `clip-path` or an SVG `mask` to one bold shape taken from the subject (a four-lobed flower, a circle, an arch, a chamfered block), 38vw across, positioned so the panel's bottom edge crops its lowest fifth. Right side, starting at 63% of the width and 56px from the top: two text blocks 300px wide and 64px apart, each a subhead at 22px over a four-line paragraph at 15px; then one solid button in the accent colour. Between the statement and the text blocks the panel is empty. One photograph only.
On a phone: The panel is inset 10px and stacks: the statement at 8.5vw, then the two text blocks at full width, the button, and last the shaped photograph at 86vw across, centred and cropped by the panel's bottom edge by a quarter of its height.

Adjusted for this page:
- It names its own corners: use the one radius of this page (square unless the direction says otherwise) and one button shape.
- It sets a sentence large over several lines: jurors read that as a long headline. Either cut it to a two-line headline at display size, or keep it a statement at 36px or less on three lines (24px, four lines on a phone).

### 4. cta — The action tile (grid)
The close is one row of the board. Three filled tiles sit side by side with 8–14px gaps, all 360px tall and sharing one radius: a wide centre tile spanning columns 3–10 in the accent colour, flanked by two narrow tiles (columns 1–2 and 11–12) that run off the left and right viewport edges, as if the row had been cropped from a longer one. The centre tile holds, left-aligned and vertically centred with 40px padding: a heading of three to five words at 40px, two lines at 17px, and the action. The action is either one rectangular button or an email field 420px wide in the paper colour with the submit button nested inside its right end. The flanking tiles hold no text: one is a photograph covering the tile, the other a flat palette colour. No shadows, no outlines.
On a phone: The accent tile runs full width, about 300px tall, heading at 28px, field and button stacked at full width. The two flanking tiles follow beneath as a pair, each half width and 120px tall, with the same gap and the same radius.

Adjusted for this page:
- It mentions a shadow: only on something open above the page (a menu, a dialog), never on a resting element.

### 5. footer — Contact as the headline (statement)
A full-bleed field in one saturated palette colour, at least 90svh tall. Top row, 40px from the edge: two or three short notes at 15px in columns 1–7 (address, hours, a one-line description) and a back-to-top text link at the right margin. Then a tall empty gap. In the lower half, the way to get in touch is the display line: the telephone number or the email address itself, set at 8–9vw, flush left, hard against the margin, as one link. An email address may break once, before the @, giving two lines. Size it with `clamp()` so the longest line fills at least 80% of the width. Under it, one row of small text at 14px spread across three positions: links at the left, credits in the centre, city and year at the right. The wordmark appears only small, in the top row.
On a phone: Notes stack at the top at 15px. The contact line sits in the lower half at 12vw; a telephone number stays on one line, an email breaks before the @ and is sized so each half fits the width. The meta row becomes three stacked lines at 13px.

## 8. Motion — Masked headline
On load, each line of the headline rises from behind its own baseline, about 900ms with a strong ease-out, the second line 110ms after the first; the supporting sentence and the action then fade up together. Nothing else on the page performs. Because headlines are two lines at most, you author the line breaks and wrap each line yourself. Recipe: 'Masked line reveal' in references/motion.md.
This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): an entrance for the parts of every section, feedback on every control, and one moving picture. The inspector fails a page that barely moves. Recipes: references/motion.md.

## 10. Where the richness comes from
Colour at scale. A whole screen of one saturated colour is rich on its own, so a chapter needs few elements; it still needs its content at full size, because a coloured screen with one small line on it reads as empty.

## 11. How this direction goes wrong
Check contrast on every field with the palette's assigned ink. Do not put cards on the fields. Do not use more than six colours. Two neighbouring fields should differ clearly in lightness as well as hue.

## 12. Real references
Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.
- **Ai in Design Report 2026** (Awwwards Site of the Day, studied score 8.4) `aww-ai-in-design-report-2026`
  Idea: A research report laid out like a colour-blocked print annual: a thermal-blurred video collage on top, an oversized tight grotesk title, and flat orange, lilac, sage and black blocks carrying stats, quotes and chapters.
  Hero: The top 53% is a full-width video band: blurred, heat-map-like abstract footage in orange, lilac and sage, overlaid with four or five hard-edged rectangles of the same footage in grey or green, two tagged with tiny mono labels in white boxes. The header sits flush on top: a black logo block at far left, an orange link tab running to 40% of the width, two plain links at right. Below the band, on white: a two-line deck at about 1.4vw on a 1% left margin, and from 42% across a two-line title at 8.3vw, medium weight, tracking -0.06em. Bottom row: mono credit left, scroll cue and arrow aligned to the title column.
  Worth taking: Start most headings and text at a fixed column line about 42% across, leaving the left for small decks, credits and chapter numbers.
- **Warm & Fuzzy** (Awwwards Site of the Day, studied score 7.7) `aww-warm-fuzzy`
  Idea: A showreel-first studio site in which every section takes one flat, loud colour (blue, black, yellow) under heavy grotesk type and a chunky custom wordmark.
  Hero: The showreel plays full-bleed with a visible film-grain overlay and no scrim. A chunky hand-cut wordmark sits top left, 16px from the edges; the same top line continues with a one-sentence status link, a tiny thumbnail beside the latest project's name, and three caps links at the far right, all white over the footage. A small green caps play label floats at dead centre. The tagline is anchored bottom left, 16px from both edges, in white grotesk caps at 47px (3.3vw) on one line spanning 56% of the width. A tiny square pause control sits bottom right.
  Worth taking: Give every section one flat saturated background and change it at each section break, keeping type strictly black or white.
- **Trevor Noah** (Awwwards Site of the Day, studied score 7.8) `aww-trevor-noah`
  Idea: The comedian as a paper cut-out sticker: his head is torn open and the things he makes (stand-up, books, video) spill out and become the navigation.
  Hero: The desktop capture caught a blank navy frame before the canvas painted; the next frame and the mobile shot show the scene. A deep navy field. The name runs across the top in bold pink grotesk on one line, sized to nearly touch both edges. Centred below is a photographic cut-out of the face with a thick white sticker outline and a torn top edge, from which glossy 3D objects (microphone, book, video player, brain, heart) erupt. Circular arrow buttons sit at the left and right edges; a torn-paper white label beneath the face names the current category. A hairline, a text ticker and a pink pill close the bottom.
  Worth taking: Cut the subject out of a photo with a thick white sticker border and a torn edge so photography behaves like illustration.
Full notes on any of them: `node draw.mjs --site <id>`.

## Always
Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,
no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no
section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section.
`inspect.mjs` measures all of it.

Saved to /tmp/claude-0/-home-user-Projetos/d293e8b6-a752-5326-a770-ddaa656857d4/scratchpad/taste/.taste-skill/direction.json · reprint with `node draw.mjs --show`
