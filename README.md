# Minimal Portfolio Repo (v5)

Generated on 2025-09-18 19:15.

**How it works**
- Put projects in `projects/` as subfolders: `projects/<YEAR>_<org>_<title>/`.
- Each project keeps a compact structure for easy browsing and LLM ingestion:
  - `brief.md` — one-page case study (Problem → Actions → Results) + highlights
  - `metadata.json` — machine-friendly fields for resume/portfolio generation
  - `cover.jpg` — optional hero image for galleries
  - `assets/` — routed uploads (images, video, docs, other)
  - `deliverables/` — finals to ship

**CLI helper**
Use `scripts/new_project.py` to generate a new project quickly.

```bash
python3 scripts/new_project.py \
  --title "Spring Launch" \
  --organization "Caribbean Pools & Spas" \
  --work-type "Employment" \
  --year 2025 \
  --role "Designer" \
  --seniority "Lead" \
  --categories "Branding,Social" \
  --skills "typography,layout" \
  --tools "Figma,Illustrator" \
  --tags "branding,video" \
  --highlights "Increased CTR 22%;Cut time-to-publish by 40%" \
  --link-live "https://example.com" \
  --link-repo "https://github.com/you/repo" \
  --link-video "https://youtu.be/xyz" \
  --nda 0
```
