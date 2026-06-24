"""Generate bundled local knowledge PDFs for initial ingestion."""

from pathlib import Path

import fitz

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "data" / "knowledge"

SAMPLE_DOCUMENTS = {
    "ntpc_fgd_operations_guide.pdf": """
NTPC FGD Operations Guide

Flue Gas Desulfurization (FGD) removes sulfur dioxide from exhaust gases of fossil-fuel power plants.
NTPC uses wet limestone FGD systems at several coal-based stations.

Key operating parameters:
- Limestone slurry concentration: 15-20 percent
- pH range in absorber: 5.2 to 6.0
- Gypsum purity target: above 90 percent

Routine checks include slurry density monitoring, mist eliminator inspection, and pump vibration analysis.
Operators must log absorber inlet and outlet SO2 readings every shift.

Emergency shutdown is required if absorber pH drops below 4.5 or if slurry recirculation pumps fail.
Contact the plant control room immediately for any FGD trip event.
""",
    "ntpc_safety_bulletin.pdf": """
NTPC Safety Bulletin

Personal Protective Equipment (PPE) is mandatory in all plant operational areas.
Hard hats, safety shoes, and flame-resistant coveralls must be worn at all times.

Hot work permits are required for welding, cutting, or grinding near fuel handling systems.
Confined space entry requires gas testing, attendant assignment, and rescue plan approval.

Report all near-miss incidents within 24 hours through the NTPC safety portal.
First aid stations are located at each unit control building entrance.
""",
}


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename, content in SAMPLE_DOCUMENTS.items():
        output_path = OUTPUT_DIR / filename
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)
        page.insert_textbox(
            fitz.Rect(72, 72, 523, 770),
            content.strip(),
            fontsize=11,
            fontname="helv",
        )
        doc.save(output_path)
        doc.close()
        print(f"Created {output_path}")


if __name__ == "__main__":
    main()
