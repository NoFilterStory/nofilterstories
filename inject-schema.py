#!/usr/bin/env python3
"""
inject-schema.py
----------------
Adds/replaces the Organization + LocalBusiness + Speakable structured data
blocks in index.html without touching any other content or styling.

Usage:
  python3 inject-schema.py index.html
  (writes index.html in-place, backs up as index.html.bak)
"""

import sys, re, shutil, pathlib, json

TARGET = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path("index.html")
BACKUP = TARGET.with_suffix(".html.bak")

# ── New schema blocks to inject ──────────────────────────────────────────────

ORGANIZATION_SCHEMA = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "@id": "https://www.nofiltersstories.com/#organization",
    "name": "No Filters Stories",
    "url": "https://www.nofiltersstories.com",
    "logo": {
        "@type": "ImageObject",
        "url": "https://www.nofiltersstories.com/og-image.webp"
    },
    "image": "https://www.nofiltersstories.com/og-image.webp",
    "description": "No Filters Stories is a photography studio specializing in boudoir, portrait, and lifestyle photography. Photographer Geo creates empowering, intimate portraits for clients of all backgrounds.",
    "priceRange": "$$",
    "hasMap": "https://www.google.com/maps?q=No+Filters+Stories+Photography",
    "telephone": "",           # ← add if you have one
    "email": "",               # ← add if you have one
    "address": {
        "@type": "PostalAddress",
        "addressCountry": "BG" # ← update with full address when ready
    },
    "sameAs": [
        "https://www.instagram.com/nofiltersstories"  # ← add all social profiles
    ],
    "founder": {
        "@type": "Person",
        "name": "Geo",
        "jobTitle": "Photographer",
        "url": "https://www.nofiltersstories.com/about.html"
    },
    "knowsAbout": [
        "Boudoir Photography",
        "Portrait Photography",
        "Lifestyle Photography",
        "Empowerment Photography"
    ]
}

WEBSITE_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.nofiltersstories.com/#website",
    "url": "https://www.nofiltersstories.com",
    "name": "No Filters Stories",
    "description": "Photography studio specializing in boudoir, portrait, and lifestyle sessions.",
    "publisher": {
        "@id": "https://www.nofiltersstories.com/#organization"
    }
}

def make_script_tag(data: dict) -> str:
    return (
        '<script type="application/ld+json">\n'
        + json.dumps(data, indent=2, ensure_ascii=False)
        + '\n</script>'
    )

def main():
    if not TARGET.exists():
        print(f"ERROR: {TARGET} not found. Run from the folder containing index.html.")
        sys.exit(1)

    shutil.copy(TARGET, BACKUP)
    print(f"Backed up to {BACKUP}")

    html = TARGET.read_text(encoding="utf-8")

    # Remove any existing Organization / LocalBusiness schema blocks
    html = re.sub(
        r'<script type="application/ld\+json">\s*\{[^<]*?"@type"\s*:\s*[\[\"](?:Organization|LocalBusiness|WebSite)[^\}]*\}\s*</script>',
        '',
        html,
        flags=re.DOTALL
    )

    # Build the two new blocks
    new_blocks = (
        make_script_tag(ORGANIZATION_SCHEMA)
        + "\n  "
        + make_script_tag(WEBSITE_SCHEMA)
    )

    # Inject just before </head>
    if "</head>" in html:
        html = html.replace("</head>", f"  {new_blocks}\n</head>", 1)
        print("Injected Organization + WebSite schema before </head>")
    else:
        # Fallback: prepend to <body>
        html = html.replace("<body", f"{new_blocks}\n<body", 1)
        print("WARNING: No </head> found; injected before <body>")

    TARGET.write_text(html, encoding="utf-8")
    print(f"Done. Review {TARGET}, then upload to GitHub and purge Cloudflare cache.")

if __name__ == "__main__":
    main()
