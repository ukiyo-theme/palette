"""Install instructions for the tools listed on the karazuri homepage."""

from html import escape


ORG = "https://github.com/karazuri"


def variant_files(path):
    return [(variant.capitalize(), path.format(variant)) for variant in ("umi", "yoru", "kami")]


def extras(anchor, name, scope, steps="", files=()):
    return (name, scope, f"{ORG}/extras#{anchor}", steps, files)


VSIX = [("Download VSIX", "karazuri.vsix")]
VSIX_STEPS = "Run Extensions: Install from VSIX… from the Command Palette, then choose a karazuri variant."
OPENCODE_FILES = [
    ("1.x", variant_files("opencode/karazuri-{}.json")),
    ("2.x", variant_files("opencode/v2/karazuri-{}.json")),
]

GROUPS = [
    ("Editors", [
        ("Neovim", "Editor, syntax, and plugins", f"{ORG}/nvim#installation", "", ()),
        ("VS Code", "Editor, syntax, and workbench", f"{ORG}/vscode#how-to-use", VSIX_STEPS, VSIX),
        ("Cursor", "Editor, syntax, and workbench", f"{ORG}/vscode#how-to-use", VSIX_STEPS, VSIX),
        ("VSCodium", "Editor, syntax, and workbench", f"{ORG}/vscode#how-to-use", VSIX_STEPS, VSIX),
        ("Zed", "Editor, syntax, and workbench", f"{ORG}/zed#how-to-use",
         "Copy the theme file to ~/.config/zed/themes/ on macOS or Linux. Restart Zed and open the theme selector.",
         [("Download theme", "zed/karazuri.json")]),
        extras("jetbrains-ides", "JetBrains IDEs", "Editor, syntax, and IDE interface",
               "In IntelliJ Platform 2024.3 or later, open Settings → Plugins → Install Plugin from Disk…, select the JAR, and restart if prompted.",
               [("Download plugin", "jetbrains/karazuri.jar")]),
        extras("helix", "Helix", "Editor and syntax"),
        extras("sublime-text", "Sublime Text", "Editor color scheme"),
    ]),
    ("Agents", [
        ("T3 Code", "Interface and terminal", f"{ORG}/t3code#how-to-use",
         "Copy a theme file to ~/.t3/userdata/themes/ and select it in Settings. Both themes use Kami in light mode.",
         [("Umi + Kami", "t3code/karazuri.json"), ("Yoru + Kami", "t3code/karazuri-yoru.json")]),
        extras("opencode", "OpenCode", "Terminal UI, syntax, and diffs",
               "Check opencode --version and choose the matching file. Copy it to ~/.config/opencode/themes/, restart, and run /themes.",
               OPENCODE_FILES),
        extras("codex-cli", "Codex CLI", "Syntax and diffs",
               "Copy the file into the themes directory under CODEX_HOME (defaults to ~/.codex), then run /theme. Set the same variant in your terminal to match the rest of the session.",
               variant_files("tmtheme/karazuri-{}.tmTheme")),
        extras("claude-code", "Claude Code", "Prompts, messages, and diffs",
               "Copy the file into ~/.claude/themes/ and choose it with /theme. Set your terminal to the same variant for the background.",
               variant_files("claude-code/karazuri-{}.json")),
        extras("pi", "Pi", "Messages, tools, syntax, and diffs",
               "Copy the file into ~/.pi/agent/themes/, restart or run /reload, then pick Theme in /settings. Your terminal supplies the session background.",
               variant_files("pi/karazuri-{}.json")),
    ]),
    ("Terminals & CLI", [
        extras("ghostty", "Ghostty", "Terminal scheme"),
        extras("kitty", "kitty", "Terminal scheme"),
        extras("wezterm", "WezTerm", "Terminal scheme"),
        extras("alacritty", "Alacritty", "Terminal scheme"),
        extras("iterm2", "iTerm2", "Terminal scheme"),
        extras("windows-terminal", "Windows Terminal", "Terminal scheme",
               r"Put karazuri.json in the karazuri folder under %LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments. Restart Windows Terminal and choose a Color scheme under a profile’s Appearance.",
               [("Download schemes", "windows-terminal/karazuri.json")]),
        extras("tmux", "tmux", "Multiplexer interface"),
        extras("fzf", "fzf", "Finder interface"),
        extras("delta", "delta", "Git diff and syntax"),
        extras("bat", "bat", "Syntax"),
    ]),
]


def download_links(files):
    links = []
    for label, path in files:
        if isinstance(path, list):
            links.append(f'<div class="download-version"><span>{escape(label)}</span>{download_links(path)}</div>')
        else:
            links.append(f'<a href="downloads/{escape(path)}" download>{escape(label)}</a>')
    return "\n".join(links)


def render_tools():
    """Keep the directory visible and usable on a static page with no scripts."""
    groups = []
    for title, tools in GROUPS:
        rows = []
        for name, scope, guide, steps, files in tools:
            slug = name.lower().replace(" ", "-")
            action = f'<a href="{escape(guide)}" aria-label="{escape(name)} install guide">Install guide</a>'
            extension = "png" if slug in {"t3-code", "kitty", "windows-terminal", "fzf", "ghostty"} else "svg"
            icon = f'<img class="tool-icon" src="tool-icons/{slug}.{extension}" alt="" width="24" height="24" loading="lazy">'
            information = f'<span class="tool-name">{icon}{escape(name)}</span>'
            if title != "Editors":
                information += f'<span class="tool-scope">{escape(scope)}</span>'
            if files:
                row = (
                    f'<details><summary class="tool-row">{information}<span class="install-action">Install</span></summary>'
                    f'<div class="install-steps"><p>{escape(steps)}</p><div class="download-links">'
                    f'{download_links(files)}</div>{action}</div></details>'
                )
            else:
                row = f'<div class="tool-row">{information}{action}</div>'
            rows.append(f'<li class="tool" id="install-{slug}">{row}</li>')
        groups.append(f'<section class="tool-group"><h3>{escape(title)}</h3><ul>\n'
                      + "\n".join(rows) + "\n</ul></section>")
    return "\n".join(groups)
