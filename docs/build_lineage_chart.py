"""Build the reactor lineage reference chart.

IC2 figures are from the official IndustrialCraft wiki (wiki.industrial-craft.net).
Reactor Knockoff figures were read off the running game at
cwmonkey.github.io/reactor-knockoff and its source. Reactor Revived figures come
from www/js/parts.js in this repo.

    python docs/build_lineage_chart.py
"""

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

INK = colors.HexColor("#1b1f24")
DIM = colors.HexColor("#5c656f")
RULE = colors.HexColor("#c3cbd3")
BAND = colors.HexColor("#eef1f4")
ACCENT = colors.HexColor("#2f6f3e")
HEAT = colors.HexColor("#b4551f")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Title"], fontName="Helvetica-Bold",
                    fontSize=20, leading=24, textColor=INK, alignment=TA_LEFT, spaceAfter=2)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], fontName="Helvetica",
                     fontSize=10, leading=13, textColor=DIM, spaceAfter=10)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=12.5, leading=15, textColor=INK, spaceBefore=10, spaceAfter=4)
BODY = ParagraphStyle("BODY", parent=styles["Normal"], fontName="Helvetica",
                      fontSize=9, leading=12.5, textColor=INK, spaceAfter=5)
NOTE = ParagraphStyle("NOTE", parent=BODY, fontSize=8, leading=11, textColor=DIM)
CELL = ParagraphStyle("CELL", parent=styles["Normal"], fontName="Helvetica",
                      fontSize=8, leading=10.2, textColor=INK)
CELLB = ParagraphStyle("CELLB", parent=CELL, fontName="Helvetica-Bold")
HEAD = ParagraphStyle("HEAD", parent=CELL, fontName="Helvetica-Bold",
                      fontSize=8, textColor=colors.white)


FRAME = 297 * mm - 28 * mm  # landscape A4 less the margins


def table(rows, weights, align=None):
    """A table with a dark header row and banded body, scaled to fill the page."""
    total = sum(weights)
    widths = [w / total * FRAME for w in weights]
    data = [[Paragraph(c, HEAD) for c in rows[0]]]
    data += [[Paragraph(c, CELL) for c in r] for r in rows[1:]]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), INK),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ("BOX", (0, 0), (-1, -1), 0.6, RULE),
    ]
    for i in range(2, len(data), 2):
        style.append(("BACKGROUND", (0, i), (-1, i), BAND))
    t.setStyle(TableStyle(style + (align or [])))
    return t


def section(title, rows, weights):
    """A heading and its table, kept on one page so no heading is orphaned."""
    return KeepTogether([Paragraph(title, H2), table(rows, weights)])


# ---------------------------------------------------------------- page 1 ----
story = [
    Paragraph("The Reactor Lineage", H1),
    Paragraph(
        "IndustrialCraft&sup2; &rarr; Reactor Incremental &rarr; Reactor Knockoff &rarr; Reactor Revived "
        "&mdash; a component reference and a family tree.", SUB),

    Paragraph("Where this game comes from", H2),
    Paragraph(
        "<b>Reactor Revived</b> is a clean-room rewrite of <b>Reactor Knockoff</b> (cwmonkey, 2013), which is a "
        "browser clone of <b>Reactor Incremental</b> (Cael, Kongregate), which is in turn an idle-game treatment of "
        "the nuclear reactor from <b>IndustrialCraft&sup2;</b>, the Minecraft mod. Four generations, and the physics "
        "survived all of them: you place fuel in a grid, adjacent fuel makes more power but far more heat, and "
        "everything else on the grid exists to move that heat somewhere it will not kill you.", BODY),
    Paragraph(
        "IC&sup2; ships two reactor implementations, <b>Legacy</b> (the original, EU-only) and <b>Experimental</b> "
        "(the rewrite, which added fluid cooling and MOX fuel). The component set below is the Experimental one, "
        "which is what the descendants copied.", BODY),

    Paragraph("The law every generation inherited", H2),
    Paragraph(
        "IC&sup2;'s fuel rods produce <b>5 EU/t &times; n</b> and <b>2n(n+1)</b> heat per second, where "
        "<i>n</i> is the rod plus its adjacent rods. Power is <b>linear</b> in neighbours; heat is <b>quadratic</b>. "
        "That single asymmetry is the whole game &mdash; packing fuel together is always tempting and always "
        "punished &mdash; and every descendant kept it:", BODY),
]

story.append(table(
    [["Game", "Power from a cell", "Heat from a cell", "Shape"],
     ["IndustrialCraft&sup2;", "5 &times; n", "2n(n + 1)", "linear / quadratic"],
     ["Reactor Knockoff", "base &times; (m + p)", "base &times; (m + p)&sup2; &divide; count", "linear / quadratic"],
     ["Reactor Revived", "base &times; (m + p)", "base &times; (m + p)&sup2; &divide; count", "linear / quadratic"]],
    [42, 55, 62, 40]))

story += [
    Spacer(1, 4),
    Paragraph(
        "<i>n</i> = this rod plus adjacent rods. <i>m</i> = the pack's cell multiplier (1, 4, 12), "
        "<i>p</i> = pulses from neighbouring cells, <i>count</i> = cells in the pack. Knockoff simplified "
        "IC&sup2;'s 2n(n+1) to a clean square, which is the same curve with a gentler constant.", NOTE),

    Paragraph("Fuel: the numbers line up almost exactly", H2),
]

story.append(table(
    [["Pack", "IC&sup2; EU/t", "IC&sup2; heat/s", "IC&sup2; ratio", "Revived power &times;", "Revived heat &times;"],
     ["Single rod", "5", "4", "1 : 1", "1", "1"],
     ["Dual rod", "20", "24", "4 : 6", "4", "8"],
     ["Quad rod", "60", "96", "12 : 24", "12", "36"]],
    [30, 24, 26, 26, 46, 46]))

story += [
    Spacer(1, 4),
    Paragraph(
        "Power multipliers are <b>identical</b> across the two games &mdash; 1, 4, 12. Heat diverges: IC&sup2; runs "
        "1, 6, 24 where the browser games run 1, 8, 36, because the square is steeper than 2n(n+1). Packing fuel "
        "is punished harder here than in Minecraft.", NOTE),
    PageBreak(),
]

# ---------------------------------------------------------------- page 2 ----
story += [
    Paragraph("IndustrialCraft&sup2; reactor components", H1),
    Paragraph("The grandfather's part list, with its published figures.", SUB),
]
story.append(section(
    "Fuel rods",
    [["Component", "Output", "Heat/s", "Lifetime", "Notes"],
     ["Fuel Rod (Uranium)", "5 EU/t", "4", "20,000 s", "2,000,000 EU over a full cycle"],
     ["Dual Fuel Rod", "20 EU/t", "24", "20,000 s", "Two rods in one slot"],
     ["Quad Fuel Rod", "60 EU/t", "96", "20,000 s", "Four rods in one slot"],
     ["Fuel Rod (MOX)", "varies", "varies", "20,000 s", "Output rises as the reactor gets hotter"]],
    [42, 22, 18, 26, 84]))

story.append(section(
    "Heat vents &mdash; destroy heat",
    [["Component", "Cools itself", "Pulls from reactor", "Cools neighbours", "Max heat"],
     ["Heat Vent", "6/s", "&mdash;", "&mdash;", "1,000"],
     ["Advanced Heat Vent", "12/s", "&mdash;", "&mdash;", "1,000"],
     ["Reactor Heat Vent", "5/s", "5/s", "&mdash;", "1,000"],
     ["Overclocked Heat Vent", "20/s", "36/s", "&mdash;", "1,000"],
     ["Component Heat Vent", "&mdash;", "&mdash;", "4/s each", "&mdash;"]],
    [46, 26, 32, 32, 24]))

story.append(section(
    "Heat exchangers &mdash; move heat around",
    [["Component", "With neighbours", "With the reactor", "Max heat"],
     ["Heat Exchanger", "12/s", "4/s", "2,500"],
     ["Advanced Heat Exchanger", "24/s", "8/s", "10,000"],
     ["Reactor Heat Exchanger", "&mdash;", "72/s", "5,000"],
     ["Component Heat Exchanger", "36/s", "&mdash;", "5,000"]],
    [52, 34, 34, 26]))

story.append(section(
    "Storage, reflection and hull",
    [["Component", "Figure", "What it does"],
     ["10k Coolant Cell", "10,000 heat", "Absorbs heat; cannot shed it on its own"],
     ["30k Coolant Cell", "30,000 heat", "As above"],
     ["60k Coolant Cell", "60,000 heat", "As above"],
     ["RSH-Condensator", "20,000 heat", "Single use; recharged with redstone"],
     ["LZH-Condensator", "100,000 heat", "Single use; recharged with lapis or redstone"],
     ["Neutron Reflector", "20,000 pulses", "Boosts an adjacent rod without adding heat"],
     ["Thick Neutron Reflector", "120,000 pulses", "As above, far more durable"],
     ["Reactor Plating", "+1,000 hull heat", "Also reduces explosion radius by 5%"],
     ["Containment Reactor Plating", "+500 hull heat", "Reduces explosion radius by 10%"],
     ["Heat-Capacity Reactor Plating", "+1,700 hull heat", "Reduces explosion radius by 1%"]],
    [56, 32, 111]))

story += [
    Spacer(1, 5),
    Paragraph(
        "A bare reactor hull holds <b>10,000</b> heat before it starts taking damage. Figures are from the official "
        "IndustrialCraft&sup2; wiki; the wiki flags its own fuel-rod page as outdated, so treat the rod mechanics as "
        "indicative of the Legacy behaviour the browser games were cloned from rather than of current IC&sup2;.", NOTE),
    PageBreak(),
]

# ---------------------------------------------------------------- page 3 ----
story += [
    Paragraph("What became what", H1),
    Paragraph("Every IC&sup2; component, traced to the part it turned into in this game.", SUB),
]

story.append(section(
    "Component by component",
    [["IndustrialCraft&sup2;", "Reactor Revived", "Tiers", "How it changed"],
     ["Fuel Rod (Uranium) &times;1 / &times;2 / &times;4",
      "Uranium Cell, Uranium&times;2, Uranium&times;4", "3 packs",
      "Kept whole. Six more fuel types were added above it: plutonium, thorium, seaborgium, dolorium, nefastium, protium."],
     ["Fuel Rod (MOX)", "Protium Cell", "3 packs",
      "MOX rewards a hot reactor; protium instead gets permanently stronger each time one is spent."],
     ["Neutron Reflector / Thick", "Neutron Reflector", "6",
      "Became a percentage power bonus to adjacent cells, with a finite pulse life, and a tier-6 variant that also adds heat."],
     ["Heat Vent (all five kinds)", "Heat Vent", "6",
      "The five IC&sup2; vent variants collapsed into one part with six tiers. The tier-6 Extreme Vent burns reactor power to do its cooling."],
     ["Heat Exchanger (all four kinds)", "Heat Exchanger", "6",
      "Same collapse. Ours balances heat by <i>percentage full</i> across itself and its neighbours rather than by fixed rates."],
     ["Reactor Heat Exchanger", "Heat Inlet / Heat Outlet", "6 each",
      "Split in two, and made directional: the inlet pulls heat out of neighbours into the reactor, the outlet pushes it the other way."],
     ["10k / 30k / 60k Coolant Cell", "Coolant Cell", "6",
      "One part, six tiers. Still pure storage that cannot cool itself. The tier-6 Thermionic cell converts half of what it absorbs into power."],
     ["Reactor Plating (three kinds)", "Reactor Plating", "6",
      "Kept as hull heat capacity. The explosion-radius mechanic was dropped &mdash; there is no world to damage."],
     ["RSH / LZH-Condensator", "&mdash;", "&mdash;",
      "Dropped. Both are consumables you recharge by hand, which does not fit an idle game."],
     ["&mdash;", "Capacitor", "6",
      "New. Raises the reactor's maximum <i>power</i> rather than its heat, which IC&sup2; had no need for."],
     ["&mdash;", "Particle Accelerator", "6",
      "New. Converts heat into Exotic Particles, the prestige currency. Explodes into an instant meltdown if it overheats."]],
    [46, 40, 16, 97]))

story += [
    Paragraph("What the browser games added", H2),
    Paragraph(
        "IC&sup2;'s reactor is a puzzle you solve once and then leave running. The idle-game descendants bolted on a "
        "progression: money and an auto-sell rate, a shop of ~60 upgrades, a reactor that grows from a fixed grid via "
        "expansion upgrades, and a prestige loop &mdash; bank Exotic Particles, wipe the board, keep the research. "
        "None of that exists in Minecraft, where the reactor is a machine in a world rather than the world itself.", BODY),
    Paragraph(
        "Going the other way, plenty was dropped: fluid cooling and the Reactor Pressure Vessel, the crafting tree "
        "behind every component, depleted-rod reprocessing, and the fact that a real IC&sup2; meltdown takes a crater "
        "out of your base.", BODY),

    Spacer(1, 6),
    Paragraph(
        "Sources &mdash; IC&sup2; figures: wiki.industrial-craft.net. Reactor Knockoff figures: read off the running "
        "game at cwmonkey.github.io/reactor-knockoff and its source. Reactor Revived figures: www/js/parts.js in this "
        "repository. Where a number is disputed between sources, the IC&sup2; wiki's value is the one printed here.", NOTE),
]

doc = SimpleDocTemplate(
    "docs/reactor-lineage-chart.pdf", pagesize=landscape(A4),
    leftMargin=14 * mm, rightMargin=14 * mm, topMargin=12 * mm, bottomMargin=12 * mm,
    title="The Reactor Lineage", author="Reactor Revived",
)
doc.build(story)
print("wrote docs/reactor-lineage-chart.pdf")
