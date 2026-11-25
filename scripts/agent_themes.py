"""Color role mappings for terminal coding agents."""

SYNTAX = {
    "comment": "comment", "keyword": "keyword", "function": "func",
    "variable": "fg", "string": "string", "number": "number",
    "type": "type", "operator": "operator", "punctuation": "punct",
}

MARKDOWN = {
    "text": "fg", "heading": "keyword", "link": "func", "linkText": "type",
    "code": "string", "blockQuote": "fg_dim", "emphasis": "field",
    "strong": "constant", "horizontalRule": "border", "listItem": "func",
    "listEnumeration": "number", "image": "func", "imageText": "type",
    "codeBlock": "fg",
}


def map_colors(colors, roles):
    return {key: colors[role] for key, role in roles.items()}


def opencode_colors(c):
    markdown = {"emph" if key == "emphasis" else key: role for key, role in MARKDOWN.items()}
    return {
        **map_colors(c, {
            "primary": "func", "secondary": "type", "accent": "keyword",
            "error": "error", "warning": "warn", "success": "string", "info": "info",
            "text": "fg", "textMuted": "fg_dim", "selectedListItemText": "bg",
            "background": "bg", "backgroundPanel": "bg_m1",
            "backgroundElement": "bg_p2",
            "border": "border", "borderActive": "func", "borderSubtle": "bg3",
            "diffAdded": "fg", "diffRemoved": "fg", "diffContext": "fg_dim",
            "diffHunkHeader": "info", "diffHighlightAdded": "string",
            "diffHighlightRemoved": "error", "diffAddedBg": "diff_add",
            "diffRemovedBg": "diff_delete", "diffContextBg": "bg_m1",
            "diffLineNumber": "fg_dim", "diffAddedLineNumberBg": "diff_add",
            "diffRemovedLineNumberBg": "diff_delete",
        }),
        **{f"syntax{key.title()}": c[role] for key, role in SYNTAX.items()},
        **{f"markdown{key[0].upper()}{key[1:]}": c[role] for key, role in markdown.items()},
    }


def opencode_v2_theme(c, dark, mix):
    colors = opencode_colors(c)
    feedback = ("error", "warning", "success", "info")
    actions = ("primary", "secondary", "destructive")
    fill = dict(zip(actions, (c["func"], c["bg_p2"], c["error"])))
    action_text = dict(zip(actions, (c["bg"], c["fg"], c["bg"])))

    base = {
        "categorical": ["accent", "interactive", "green", "yellow", "red", "cyan"],
        "text": {
            "base": c["fg"], "muted": c["fg_dim"], "faint": c["comment"],
            "action": {key: {"base": action_text[key]} for key in actions},
            "formfield": {"base": c["fg"]},
            "feedback": {key: {"base": colors[key]} for key in feedback},
        },
        "background": {
            "base": c["bg"],
            "raised": {"base": c["bg_m1"], "high": c["bg_p2"], "max": c["bg3"]},
            "action": {
                key: {"base": fill[key], "$hovered": mix(fill[key], action_text[key], 0.12)}
                for key in actions
            },
            "formfield": {"base": c["bg0"], "$focused": c["bg_p1"]},
            "feedback": {
                key: {"base": mix(c["bg"], colors[key], 0.10)} for key in feedback
            },
        },
        "border": {"base": c["border"]},
        "scrollbar": {"base": c["comment"]},
        "diff": {
            "text": {
                "added": colors["diffAdded"], "removed": colors["diffRemoved"],
                "context": colors["diffContext"], "hunkHeader": colors["diffHunkHeader"],
            },
            "background": {
                "added": colors["diffAddedBg"], "removed": colors["diffRemovedBg"],
                "context": colors["diffContextBg"],
            },
            "highlight": {
                "added": colors["diffHighlightAdded"], "removed": colors["diffHighlightRemoved"],
            },
            "lineNumber": {
                "text": colors["diffLineNumber"],
                "background": {
                    "added": colors["diffAddedLineNumberBg"],
                    "removed": colors["diffRemovedLineNumberBg"],
                },
            },
        },
        "syntax": map_colors(c, SYNTAX),
        "markdown": map_colors(c, MARKDOWN),
    }

    # OpenCode numbers hue steps from high to low contrast in either appearance.
    amounts = (0, 0.2, 0.4, 0.65, 1)
    high, low = ("#FFFFFF", "#000000") if dark else ("#000000", "#FFFFFF")
    hues = {}
    for key, role in {
        "accent": "keyword", "interactive": "func", "neutral": "comment",
        "green": "string", "yellow": "warn", "red": "error", "cyan": "type",
    }.items():
        anchor = c[role]
        steps = [mix(high, anchor, amount) for amount in amounts]
        steps.extend(mix(anchor, low, amount) for amount in amounts[1:])
        hues[key] = dict(zip(range(100, 1000, 100), steps))

    mode = "dark" if dark else "light"
    return {"$schema": "https://opencode.ai/theme.json", "base": base, mode: {"hue": hues}}


def claude_code_colors(c, mix):
    colors = map_colors(c, {
        "claude": "func", "text": "fg", "inverseText": "bg",
        "inactive": "fg_dim", "subtle": "border", "suggestion": "type",
        "permission": "keyword", "remember": "type", "success": "string",
        "error": "error", "warning": "warn", "merged": "keyword",
        "promptBorder": "func", "planMode": "type", "autoAccept": "string",
        "bashBorder": "operator", "ide": "info", "fastMode": "constant",
        "effortUltra": "special", "diffAdded": "diff_add", "diffRemoved": "diff_delete",
        "userMessageBackground": "bg_p2", "userMessageBackgroundHover": "bg3",
        "bashMessageBackgroundColor": "bg_m1", "memoryBackgroundColor": "bg_p1",
        "selectionBg": "visual", "composerSidebarBackground": "bg_m1",
        "rate_limit_fill": "func", "rate_limit_empty": "bg3", "briefLabelYou": "type",
        "briefLabelClaude": "func",
    })
    for action, role, accent in (("Added", "diff_add", "string"), ("Removed", "diff_delete", "error")):
        colors[f"diff{action}Dimmed"] = mix(c["bg"], c[role], 0.45)
        colors[f"diff{action}Word"] = mix(c[role], c[accent], 0.18)

    for token in ("claude", "warning", "permission", "promptBorder", "inactive", "fastMode"):
        colors[f"{token}Shimmer"] = mix(colors[token], c["fg"], 0.35)

    for color, role in {
        "red": "error", "orange": "constant", "yellow": "warn", "green": "string",
        "blue": "func", "indigo": "param", "violet": "keyword",
    }.items():
        colors[f"rainbow_{color}"] = c[role]
        colors[f"rainbow_{color}_shimmer"] = mix(c[role], c["fg"], 0.35)

    colors.update(map_colors(c, {
        f"{color}_FOR_SUBAGENTS_ONLY": role for color, role in {
            "red": "error", "blue": "func", "green": "string", "yellow": "warn",
            "purple": "keyword", "orange": "constant", "pink": "number", "cyan": "type",
        }.items()
    }))
    return colors


def pi_colors(c):
    return {
        **map_colors(c, {
            "accent": "func", "border": "border", "borderAccent": "func",
            "borderMuted": "bg3", "success": "string", "error": "error", "warning": "warn",
            "muted": "fg_dim", "dim": "comment", "text": "fg", "thinkingText": "fg_dim",
            "selectedBg": "visual", "scrollbarTrack": "bg3", "scrollbarThumb": "comment",
            "searchMatchBg": "search", "searchMatchText": "fg",
            "userMessageBg": "bg_p2", "userMessageText": "fg",
            "customMessageBg": "bg_m1", "customMessageText": "fg", "customMessageLabel": "keyword",
            "toolPendingBg": "bg_p1", "toolSuccessBg": "diff_add", "toolErrorBg": "diff_delete",
            "toolTitle": "fg", "toolOutput": "fg_dim",
            "mdHeading": "keyword", "mdLink": "func", "mdLinkUrl": "type",
            "mdCode": "string", "mdCodeBlock": "fg", "mdCodeBlockBorder": "comment",
            "mdQuote": "fg_dim", "mdQuoteBorder": "comment", "mdHr": "border",
            "mdListBullet": "keyword", "toolDiffAdded": "string", "toolDiffRemoved": "error",
            "toolDiffContext": "fg_dim", "thinkingOff": "comment", "thinkingMinimal": "type",
            "thinkingLow": "info", "thinkingMedium": "func", "thinkingHigh": "keyword",
            "thinkingXhigh": "number", "thinkingMax": "constant", "bashMode": "string",
        }),
        **{f"syntax{key.title()}": c[role] for key, role in SYNTAX.items()},
    }
