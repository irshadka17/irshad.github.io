import requests
from bs4 import BeautifulSoup
import json
import re
import os

USER_ID = "3aPgewgAAAAJ"
URL = f"https://scholar.google.com/citations?user={USER_ID}&hl=en&view_op=list_works&sortby=pubdate"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9"
}

print("Fetching Google Scholar page...")
html = requests.get(URL, headers=headers).text

# Detect CAPTCHA or block
if "gs_captcha" in html or "Please show you're not a robot" in html:
    print("Google Scholar blocked the request. Using fallback data.")
    # Keep existing JSON instead of failing
    if os.path.exists("_data/scholar.json"):
        print("Keeping existing _data/scholar.json")
        exit(0)
    else:
        print("No existing data. Writing empty fallback.")
        with open("_data/scholar.json", "w") as f:
            json.dump({"metrics": {}, "publications": []}, f, indent=2)
        exit(0)

soup = BeautifulSoup(html, "lxml")

# ---------------------------
# Extract metrics
# ---------------------------
metrics_table = soup.find("table", id="gsc_rsb_st")

if not metrics_table:
    print("Metrics table not found. Scholar may have changed layout.")
    # Do not fail — keep old data
    if os.path.exists("_data/scholar.json"):
        exit(0)
    else:
        with open("_data/scholar.json", "w") as f:
            json.dump({"metrics": {}, "publications": []}, f, indent=2)
        exit(0)

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

    publications.append({
        "title": title,
        "cited_by": cited_by
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

with open("_data/scholar.json", "w") as f:
    json.dump(data, f, indent=2)

print("Saved to _data/scholar.json")
