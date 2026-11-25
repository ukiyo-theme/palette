"""Supply the static Astro page with the same palette roles as the ports."""
import json

from build import ROOT, preview_data

print(json.dumps(preview_data(json.loads((ROOT / "palette.json").read_text()))))
