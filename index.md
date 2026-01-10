---
layout: default
title: Home
---

<div class="two-column">

  <!-- LEFT COLUMN -->
  <div class="left-column" markdown="1">

## Welcome

Experienced researcher specializing in X-ray diffraction studies under extreme conditions. My work focuses on carrying out high-pressure, high/low-temperature experiments on various materials, leading to novel discoveries in materials science. I also use spectroscopic techniques like Raman spectroscopy to corroborate and establish the physics and chemistry of materials.

A key aspect of my professional experience involves developing novel experimental strategies for diamond anvil cell (DAC) based studies, pushing the boundaries of what is possible in extreme conditions research.

I have extensive experience in user support, serving as the local contact for supporting users conducting synchrotron experiments involving extreme condition X-ray diffraction and Raman spectroscopic measurements.

Additionally, I manage significant operational responsibilities at the beamline, which include:

- Conducting technical evaluations of research proposals.
- Overseeing the periodic maintenance of beamline facilities.
- Preparing and documenting monthly and yearly beamline reports.

My expertise in both the technical execution of complex experiments and the operational management of a major scientific facility makes me a versatile and valuable asset to any research team.

<hr>

## Recent Publications

<div id="recentPubs"></div>

  </div> <!-- END LEFT COLUMN -->


<!-- ⭐ CLEAN HOMEPAGE SCRIPT WITH IOP VANCOUVER FORMAT -->
<script>
async function loadRecentPublications() {
  const container = document.getElementById("recentPubs");
  container.innerHTML = "Loading…";

  try {
    // Load DOIs from /assets/dois.txt
    const doiResponse = await fetch("{{ '/assets/dois.txt' | relative_url }}");
    const doiText = await doiResponse.text();
    const dois = doiText
      .split("\n")
      .map(d => d.trim())
      .filter(d => d.length > 0)
      .slice(0, 5); // Only first 5 DOIs

    const publications = [];

    // Fetch metadata for each DOI from CrossRef
    for (const doi of dois) {
      try {
        const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
        const response = await fetch(url);
        const data = await response.json();
        const cr = data.message;

        const title = cr.title ? cr.title[0] : "Untitled";

        // Build authors list + bold your name
        let authors = cr.author
          ? cr.author.map(a => `${a.given} ${a.family}`).join(", ")
          : "Unknown authors";

        authors = authors.replace(/Irshad/gi, "<strong>Irshad</strong>");

        const journal = cr["container-title"]
          ? `<em>${cr["container-title"][0]}</em>`   // italicized journal
          : "<em>Unknown journal</em>";

        const year = cr.issued
          ? cr.issued["date-parts"][0][0]
          : "—";
        const volume = cr.volume || "—";
        const issue = cr.issue || "—";
        const pages = cr.page || "—";

        publications.push({
          title,
          authors,
          journal,
          year,
          volume,
          issue,
          pages,
          doi
        });

      } catch (err) {
        console.error("Error fetching DOI:", doi, err);
      }
    }

    container.innerHTML = "";

    if (publications.length === 0) {
      container.innerHTML = "<p>No recent publications found.</p>";
      return;
    }

    // Render the 5 publications
    publications.forEach((pub, index) => {
      const doiLink = `<a href="https://doi.org/${pub.doi}" target="_blank">${pub.doi}</a>`;

      // Build IOP Vancouver reference line
      const refLine = `
        ${pub.journal}
        ${pub.volume !== "—" ? pub.volume : ""}
        ${pub.issue !== "—" ? `(${pub.issue})` : ""}
        ${pub.pages !== "—" ? `:${pub.pages}` : ""}
        ${pub.year !== "—" ? ` (${pub.year})` : ""}
      `.replace(/\s+/g, " ").trim();

      container.innerHTML += `
        <div class="pub-card" style="margin-bottom: 1rem;">

          <!-- Two-column layout for ALL content -->
          <div style="display: flex; align-items: flex-start; gap: 10px;">

            <!-- Left column: serial number -->
            <div style="
              width: 32px;
              text-align: right;
              font-weight: bold;
              flex-shrink: 0;
            ">
              ${index + 1}.
            </div>

            <!-- Right column: title + metadata -->
            <div style="flex: 1;">

              <h3 style="margin: 0; line-height: 1.3;">
                ${pub.title}
              </h3>

              <p style="margin: 0.2rem 0;">
                <strong>Authors:</strong> ${pub.authors}
              </p>

              <p style="margin: 0.2rem 0;">
                <strong>Ref:</strong> ${refLine}
              </p>

              <p style="margin: 0.2rem 0;">
                <strong>DOI:</strong> ${doiLink}
              </p>

            </div> <!-- END right column -->

          </div> <!-- END flex row -->

        </div>
      `;
    });

  } catch (err) {
    container.innerHTML = "<p>Error loading publications.</p>";
  }
}

loadRecentPublications();
</script>

  <!-- RIGHT COLUMN -->
  <div class="right-column" markdown="1">

<div class="profile-photo-container">
  <img src="{{ '/assets/images/profile.jpg' | relative_url }}" alt="Profile photo" class="profile-photo">
</div>

## Contact

<div class="contact-card">
  <ul class="contact-list">

    <li>
      <span class="icon">📧</span>
      <a href="mailto:{{ site.email_primary }}">{{ site.email_primary }}</a>
    </li>

    <li>
      <span class="icon">📧</span>
      <a href="mailto:{{ site.email_secondary }}">{{ site.email_secondary }}</a>
    </li>

    <li>
      <span class="icon">📱</span>
      {{ site.mobile_primary }}
    </li>

    <li>
      <span class="icon">📱</span>
      {{ site.mobile_secondary }}
    </li>

    <li>
      <span class="icon">🐙</span>
      <a href="{{ site.github }}" target="_blank">GitHub</a>
    </li>

    <li>
      <span class="icon">🔗</span>
      <a href="{{ site.linkedin }}" target="_blank">LinkedIn</a>
    </li>

    <li>
      <span class="icon">🟢</span>
      <a href="{{ site.orcid }}" target="_blank">ORCID</a>
    </li>

    <li>
      <span class="icon">📘</span>
      <a href="{{ site.researchgate }}" target="_blank">ResearchGate</a>
    </li>

  </ul>
</div>

  </div> <!-- END RIGHT COLUMN -->

</div> <!-- END TWO COLUMN -->


