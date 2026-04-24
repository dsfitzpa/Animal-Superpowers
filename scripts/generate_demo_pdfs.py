#!/usr/bin/env python3
"""
Generate synthesized demo PDFs for every flagship (species, superpower)
review in data/species.json.

These PDFs are NOT the actual published papers (those are paywalled and
can't be redistributed). They are synthesized abstracts + extended summaries
built from the curated review text, clearly labeled as demo content, and
designed so that the /evaluate/pdf backend pipeline exercises end-to-end
with realistic input.

Output: public/demo-papers/{species_slug}__{superpower_key}.pdf

Run:
    python3 scripts/generate_demo_pdfs.py
"""

import json
import os
import re
import sys
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

REPO = Path(__file__).resolve().parent.parent
SPECIES_JSON = REPO / "data" / "species.json"
OUT_DIR = REPO / "public" / "demo-papers"


def slug(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s[:60]


def styles():
    ss = getSampleStyleSheet()
    title = ParagraphStyle(
        "title", parent=ss["Title"],
        fontSize=14, leading=18, spaceAfter=6,
    )
    h = ParagraphStyle(
        "h", parent=ss["Heading3"],
        fontSize=10, textColor="#374151", spaceBefore=8, spaceAfter=3,
        fontName="Helvetica-Bold",
    )
    body = ParagraphStyle(
        "body", parent=ss["BodyText"],
        fontSize=9.5, leading=13.2, spaceAfter=6,
    )
    small = ParagraphStyle(
        "small", parent=ss["BodyText"],
        fontSize=8.5, leading=11.5, textColor="#4b5563",
    )
    meta = ParagraphStyle(
        "meta", parent=ss["BodyText"],
        fontSize=8, leading=10, textColor="#6b7280", spaceAfter=8,
    )
    return {"title": title, "h": h, "body": body, "small": small, "meta": meta}


def build_pdf(path: Path, species_sci, species_common, superpower_meta,
              review, all_superpowers_for_species):
    st = styles()
    doc = SimpleDocTemplate(
        str(path),
        pagesize=LETTER,
        leftMargin=0.85 * inch, rightMargin=0.85 * inch,
        topMargin=0.8 * inch, bottomMargin=0.8 * inch,
        title=f"{species_common} — {superpower_meta['label']}",
        author="Animal Superpowers demo",
    )

    story = []

    # Title: use the first citation's label when it's informative, else synthesize
    primary_cite = review["citations"][0] if review.get("citations") else None
    if primary_cite and len(primary_cite["label"]) < 140:
        title_text = primary_cite["label"]
    else:
        title_text = (
            f"{superpower_meta['label']} in <i>{species_sci}</i>: "
            f"mechanism, evidence, and potential human therapeutic targets"
        )
    story.append(Paragraph(title_text, st["title"]))

    meta_line = (
        f"<b>Species:</b> <i>{species_sci}</i> ({species_common}) "
        f"&nbsp;·&nbsp; <b>Trait:</b> {superpower_meta['label']}"
    )
    story.append(Paragraph(meta_line, st["meta"]))

    story.append(Paragraph(
        "<font color='#92400e'><b>Synthesized demo paper.</b> "
        "This PDF is generated from a curated review of the cited primary "
        "literature for demonstration of the Translational Discovery scoring "
        "pipeline. It is not the original published manuscript — consult the "
        "DOIs listed under References for the canonical sources.</font>",
        st["small"]
    ))
    story.append(Spacer(1, 8))

    # Abstract
    story.append(Paragraph("Abstract", st["h"]))
    story.append(Paragraph(review["summary"], st["body"]))

    # Mechanism detail
    story.append(Paragraph("Mechanism and evidence", st["h"]))
    story.append(Paragraph(
        f"The study of <i>{species_sci}</i> in the context of "
        f"{superpower_meta['label'].lower()} is motivated by the observation "
        f"that this species exhibits a phenotype of interest: "
        f"{superpower_meta['description']} ",
        st["body"]
    ))
    story.append(Paragraph(review["summary"], st["body"]))

    # Proposed human therapeutic targets
    if review.get("human_targets"):
        story.append(Paragraph("Proposed human therapeutic targets", st["h"]))
        targets_prose = (
            "Mechanistic inference points to the following candidate human "
            "targets and druggable nodes for translational follow-up: "
            + "; ".join(review["human_targets"]) + "."
        )
        story.append(Paragraph(targets_prose, st["body"]))

    # Cross-species context
    if len(all_superpowers_for_species) > 1:
        others = [
            sp for sp in all_superpowers_for_species if sp != superpower_meta["label"]
        ]
        if others:
            story.append(Paragraph("Related traits in this species", st["h"]))
            story.append(Paragraph(
                "The present manuscript is focused on "
                f"{superpower_meta['label'].lower()}, but "
                f"<i>{species_sci}</i> has been studied in the context of "
                f"related phenotypes including: " + ", ".join(others) + ".",
                st["body"]
            ))

    # References (real)
    if review.get("citations"):
        story.append(Paragraph("References", st["h"]))
        for c in review["citations"]:
            ref_text = c["label"]
            if c.get("doi"):
                ref_text += f". <i>DOI:</i> {c['doi']}"
            if c.get("pmid"):
                ref_text += f". PMID: {c['pmid']}"
            story.append(Paragraph(ref_text, st["small"]))
            story.append(Spacer(1, 2))

    doc.build(story)


def main():
    if not SPECIES_JSON.exists():
        sys.exit(f"species.json not found at {SPECIES_JSON}")
    data = json.loads(SPECIES_JSON.read_text())
    superpowers = data["superpowers"]
    species_data = data["species_data"]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Wipe any stale PDFs to keep the dir clean
    for p in OUT_DIR.glob("*.pdf"):
        p.unlink()

    written = []
    for sci, rec in species_data.items():
        reviews = rec.get("reviews") or {}
        if not reviews:
            continue
        # Build list of superpower labels this species has reviews for
        labels_for_sp = [superpowers[k]["label"] for k in reviews if k in superpowers]
        for sp_key, review in reviews.items():
            if sp_key not in superpowers:
                continue
            meta = superpowers[sp_key]
            out_path = OUT_DIR / f"{slug(sci)}__{sp_key}.pdf"
            build_pdf(
                out_path,
                species_sci=sci,
                species_common=rec.get("common", sci),
                superpower_meta=meta,
                review=review,
                all_superpowers_for_species=labels_for_sp,
            )
            written.append(out_path.name)

    # Write an index so the frontend can discover which PDFs exist
    index = {
        "generated_from": "data/species.json",
        "count": len(written),
        "files": sorted(written),
    }
    (OUT_DIR / "index.json").write_text(json.dumps(index, indent=2))

    print(f"Wrote {len(written)} PDFs to {OUT_DIR}")
    for name in written:
        size = (OUT_DIR / name).stat().st_size
        print(f"  {name}  ({size // 1024} KB)")


if __name__ == "__main__":
    main()
