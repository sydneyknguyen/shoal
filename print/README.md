# Shoal kit, 3D-printable

A looks-like prototype of the home kit from the app: two bought glass vases on a printed base, and hollow printed stones in three sizes, each big enough to hold a small rechargeable light. It's for holding, photographing, and user testing.

Open `preview.html` through the dev server (`http://localhost:5173/print/preview.html`) to turn each part around before printing.

## Parts (in `stl/`)

| File | Print | Size (mm) | Notes |
| --- | --- | --- | --- |
| `base-1.stl` | 1 | 172 × 172 × 15 | Left vase seat, rounded on the left |
| `base-2.stl` | 1 | 172 × 172 × 15 | Right vase seat |
| `base-3-charging-pad.stl` | 1 | 120 × 172 × 10 | Charging pad for spare stones, tapering to a 120 mm round end |
| `stone-small-top.stl` + `-bottom.stl` | 3 of each | 67 × 60 × 35 glued | Quick tasks |
| `stone-medium-top.stl` + `-bottom.stl` | 3 of each | 77 × 69 × 40 glued | A few hours |
| `stone-large-top.stl` + `-bottom.stl` | 3 of each | 87 × 78 × 45 glued | Half a day or more |
| `stones-plate-1.stl` … `-3.stl` | 1 of each | up to 243 × 237 | All 18 stone halves (3 of each size), packed onto three Bambu beds |
| `preview-assembled.stl` | don't print | 464 × 172 × 211 | The base, two vases, and stones, for looking at |

## Lights inside the stones

The stones are sized for the [Aluckyying mini submersible LED lights](https://www.amazon.com/s?k=Aluckyying+Mini+Submersible+LED+Lights+Rechargeable) (4-pack, rechargeable, remote-controlled RGB). The listing says 1.6 × 1 in (about 41 × 25 mm), but Amazon rounds, so the stones allow for a light up to 43 mm across and 27 mm tall. One stone of each size gets a light, and the fourth is a spare.

The small stone is the smallest pebble that light fits inside. Medium and large step up from small by about 15% each, closer together than in the app, so the large stones still fit the vase. `make_kit.py` checks that the light fits inside every size before it writes any files. Measure a light when it arrives; if it's smaller than 43 × 27, you can shrink the stones (see "Changing sizes").

Each stone prints as two hollow halves with 1.2 mm walls. The bottom half has a flat floor the light sits on, and a small lip that fits inside the top half so the halves line up.

**Glue only the unlit stones.** For the three lit ones, leave the seam unglued (or hold it with a strip of clear tape): the lights charge over USB, so they have to come out. Before the remote works, turn each light on once with its own metal button; after that, use the remote, since you can't press the button through the shell.

Super glue or clear UV resin works for a permanent seam. These lights are smaller than a tap light and may glow dimmer through the shell, so put a light inside one stone and check the glow before you glue a batch.

## The vase

Each base piece is sized for Dollar Tree's [Wide Cylindrical Vase, 8 in.](https://www.dollartree.com/wide-cylindrical-vase-8-in/385415) (SKU 385415). The listing gives the height (8 in) but not a usable width, so the seat assumes about 150 mm across, measured from the product photo.

The seat has stepped rings at 146, 150, 154 and 158 mm, so it still fits if the real vase is a few millimetres off. The vase sits on the smallest ring it's too wide to drop into, and the step around it keeps it from sliding. Once you have the vase, measure across its bottom and put that plus about 1 mm in `SEATS_D` for a snug fit.

The vase is about 144 mm across inside, so a large stone (87 mm) goes in easily, and about three stones fit side by side. Nine stones across two vases fill them about a third of the way.

## Filament

- **Stones:** transparent PETG, for example OVERTURE High Speed PETG, 1 kg. All 18 halves use about 260 g, so one spool is plenty.
- **Base:** any opaque color, about 200 g.

## Printing at the SJSU Engineering Makerspace

The [Makerspace](https://www.sjsu.edu/engineering/facilities/makerspace/) has Bambu P1S and X1C printers (254 × 254 mm bed, PLA and PETG) and Voron 2.4s (350 × 350 mm). Every part here fits a Bambu bed. It's open Monday to Friday, 10 a.m. to 4 p.m., staff permitting.

Submit an [iSupport ticket](https://isupport.sjsu.edu/engineering/) before you go. You can either:

- **Ask Central Shops to print it for you.** Attach the STLs to the ticket and say which filament goes with which file.
- **Book time and print it yourself.** Choose "General Question" on the ticket.

Either way, send any changes as ticket updates rather than emailing the shop.

**What to send:**

| Files | Filament | About |
| --- | --- | --- |
| `base-1.stl`, `base-2.stl`, `base-3-charging-pad.stl` | Opaque PLA, any color | 200 g |
| `stones-plate-1.stl` … `stones-plate-3.stl` | Transparent PETG (bring your own spool) | 260 g |

The base is about 464 mm long assembled, so it comes in three pieces that butt together on flat faces, in order 1, 2, 3. Glue them, or just set them side by side.

If you're printing yourself in Bambu Studio, you can skip the plates: load the single-stone files and let Bambu Studio arrange copies across plates. Ask the shop whether they'll run your own PETG spool, and check that it's dry; PETG strings when it's damp.

## Print settings

- **Stone halves:** transparent PETG, 230–250 °C. Print top halves rim-down and bottom halves flat-side down, as the files are set. No supports. The inside of the dome may sag a little at the very top, but it's hidden. For "dark" stones (ongoing tasks), print some in a deeper blue-grey.
- **Base:** opaque PLA, 15% infill. No supports.

## Changing sizes

All sizes are constants at the top of `make_kit.py`:

- **Vase fit:** `SEATS_D`.
- **Stone halves too tight or loose:** `LIP_FIT` (0.2 mm). PETG tends to print a bit oversized, so 0.3 mm may fit better.
- **A different light:** change `LIGHT` (diameter and height). If it no longer fits, the script stops and tells you which stone is too small; raise `STONE_M` until it fits.

Then run:

```bash
python3 print/make_kit.py
```

It needs only Python 3, and checks that every part is a closed, printable solid before writing it.
