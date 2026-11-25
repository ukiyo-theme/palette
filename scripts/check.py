"""Check every color in palette.json against the contrast minimums it declares.

Prints a table per variant with contrast against the background, the cursorline
(bg_p2) and the visual selection. Exits with status 1 if any declared contrast
pair is below its minimum.

Usage: python3 scripts/check.py [path/to/palette.json]
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def luminance(hex_color):
    channels = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    r, g, b = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    hi, lo = sorted((luminance(a), luminance(b)), reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def main():
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "palette.json"
    palette = json.loads(path.read_text())
    minimums = palette["contrast"]["minimum"]
    surface_minimums = palette["contrast"].get("surface_minimum", {})
    failures = []

    for name, variant in palette["variants"].items():
        colors = variant["colors"]
        bg, cursorline, visual = colors["bg"], colors["bg_p2"], colors["visual"]
        print(f"{name} ({variant['appearance']}, bg {bg})")
        print(f"  {'role':11} {'color':8} {'bg':>6} {'min':>5} {'cursor':>7} {'visual':>7}")
        for role, minimum in minimums.items():
            color = colors[role]
            ratio = contrast(color, bg)
            flag = "" if ratio >= minimum else "  FAIL"
            if flag:
                failures.append(f"{name}.{role} {color}: {ratio:.2f} < {minimum}")
            print(f"  {role:11} {color} {ratio:6.2f} {minimum:5.1f} "
                  f"{contrast(color, cursorline):7.2f} {contrast(color, visual):7.2f}{flag}")
        for surface, roles in surface_minimums.items():
            for role, minimum in roles.items():
                ratio = contrast(colors[role], colors[surface])
                if ratio < minimum:
                    failures.append(f"{name}.{role} on {surface}: {ratio:.2f} < {minimum}")
        print()

    if failures:
        print("Below minimum contrast:")
        for failure in failures:
            print("  " + failure)
        sys.exit(1)
    print("All declared color pairs meet their minimum contrast.")


if __name__ == "__main__":
    main()
