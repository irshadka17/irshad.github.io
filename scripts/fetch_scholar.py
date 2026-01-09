import json
from bs4 import BeautifulSoup
import re

INPUT_FILE = "_data/scholar.html"
OUTPUT_FILE = "_data/scholar.json"

print("Reading local snapshot:", INPUT_FILE)

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    html = f.read()

soup = BeautifulSoup(html, "lxml")

# ---------------------------
# Extract metrics
# ---------------------------
metrics_table = soup.find("table", id="gsc_rsb_st")

if not metrics_table:
    print("ERROR: Metrics table not found in snapshot.")
    exit(1)

cells = metrics_table.find_all("td", class_="gsc_rsb_std")

total_citations = int(cells[0].text.strip())
h_index = int(cells[2].text.strip())
i10_index = int(cells[4].text.strip())

# ---------------------------
# Extract citations per year
# ---------------------------
citations_per_year = {}
script_tags = soup.find_all("script")

for script in script_tags:
    if "google.visualization.arrayToDataTable" in script.text:
        rows = re.findall(r"\['(\d{4})',\s*(\d+)\]", script.text)
        for year, cites in rows:
            citations_per_year[year] = int(cites)

# ---------------------------
# Extract publications
# ---------------------------
publications = []
rows = soup.find_all("tr", class_="gsc_a_tr")

for row in rows:
    title_tag = row.find("a", class_="gsc_a_at")
    if not title_tag:
        continue

    title = title_tag.text.strip()

    cit_tag = row.find("a", class_="gsc_a_ac")
    cited_by = int(cit_tag.text.strip()) if cit_tag and cit_tag.text.strip().isdigit() else 0

   year_tag = row.find("span", class_="gsc_a_h gsc_a_hc gs_ibl")
   year = int(year_tag.text.strip()) if year_tag and year_tag.text.strip().isdigit() else None

   publications.append({
    "title": title,
    "cited_by": cited_by,
    "year": year
   })

# ---------------------------
# Save JSON
# ---------------------------
data = {
    "metrics": {
        "total_citations": total_citations,
        "h_index": h_index,
        "i10_index": i10_index,
        "citations_per_year": citations_per_year
    },
    "publications": publications
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Saved parsed data to", OUTPUT_FILE)
