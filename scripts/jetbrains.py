"""Build an installable IntelliJ Platform theme plugin with no executable code."""

import io
import json
import xml.etree.ElementTree as ET
import zipfile


def xml_text(element):
    ET.indent(element, space="  ")
    return ET.tostring(element, encoding="unicode", xml_declaration=True) + "\n"


def editor_scheme(name, c, dark):
    scheme = ET.Element("scheme", name=name, version="142",
                        parent_scheme="Darcula" if dark else "Default")
    colors = ET.SubElement(scheme, "colors")
    for key, role in {
        "CARET_COLOR": "fg", "CARET_ROW_COLOR": "bg_p2", "GUTTER_BACKGROUND": "bg",
        "LINE_NUMBERS_COLOR": "comment", "LINE_NUMBER_ON_CARET_ROW_COLOR": "fg_dim",
        "SELECTION_BACKGROUND": "visual", "SELECTION_FOREGROUND": "fg",
        "INDENT_GUIDE": "bg3", "SELECTED_INDENT_GUIDE": "border",
        "ADDED_LINES_COLOR": "git_add", "MODIFIED_LINES_COLOR": "git_change",
        "DELETED_LINES_COLOR": "git_delete",
    }.items():
        ET.SubElement(colors, "option", name=key, value=c[role][1:])

    attributes = ET.SubElement(scheme, "attributes")
    for key, settings in {
        "TEXT": {"FOREGROUND": "fg", "BACKGROUND": "bg"},
        "DEFAULT_LINE_COMMENT": {"FOREGROUND": "comment"},
        "DEFAULT_BLOCK_COMMENT": {"FOREGROUND": "comment"},
        "DEFAULT_DOC_COMMENT": {"FOREGROUND": "comment"},
        "DEFAULT_KEYWORD": {"FOREGROUND": "keyword"},
        "DEFAULT_STRING": {"FOREGROUND": "string"},
        "DEFAULT_VALID_STRING_ESCAPE": {"FOREGROUND": "special"},
        "DEFAULT_NUMBER": {"FOREGROUND": "number"},
        "DEFAULT_CONSTANT": {"FOREGROUND": "constant"},
        "DEFAULT_CLASS_NAME": {"FOREGROUND": "type"},
        "DEFAULT_CLASS_REFERENCE": {"FOREGROUND": "type"},
        "DEFAULT_FUNCTION_DECLARATION": {"FOREGROUND": "func"},
        "DEFAULT_FUNCTION_CALL": {"FOREGROUND": "func"},
        "DEFAULT_INSTANCE_FIELD": {"FOREGROUND": "field"},
        "DEFAULT_STATIC_FIELD": {"FOREGROUND": "field"},
        "DEFAULT_PARAMETER": {"FOREGROUND": "param"},
        "DEFAULT_IDENTIFIER": {"FOREGROUND": "fg"},
        "DEFAULT_OPERATION_SIGN": {"FOREGROUND": "operator"},
        "DEFAULT_COMMA": {"FOREGROUND": "punct"},
        "DEFAULT_DOT": {"FOREGROUND": "punct"},
        "DEFAULT_BRACES": {"FOREGROUND": "punct"},
        "DEFAULT_BRACKETS": {"FOREGROUND": "punct"},
        "DEFAULT_PARENTHS": {"FOREGROUND": "punct"},
        "DEFAULT_METADATA": {"FOREGROUND": "special"},
        "DEFAULT_TAG": {"FOREGROUND": "type"},
        "DEFAULT_ATTRIBUTE": {"FOREGROUND": "field"},
        "ERRORS_ATTRIBUTES": {"EFFECT_COLOR": "error"},
        "WARNING_ATTRIBUTES": {"EFFECT_COLOR": "warn"},
        "WEAK_WARNING_ATTRIBUTES": {"EFFECT_COLOR": "hint"},
        "TEXT_SEARCH_RESULT_ATTRIBUTES": {"FOREGROUND": "fg", "BACKGROUND": "search"},
        "DIFF_INSERTED": {"BACKGROUND": "diff_add"},
        "DIFF_MODIFIED": {"BACKGROUND": "diff_change"},
        "DIFF_DELETED": {"BACKGROUND": "diff_delete"},
    }.items():
        value = ET.SubElement(ET.SubElement(attributes, "option", name=key), "value")
        for field, role in settings.items():
            ET.SubElement(value, "option", name=field, value=c[role][1:])
        if "EFFECT_COLOR" in settings:
            ET.SubElement(value, "option", name="EFFECT_TYPE", value="2")
    return xml_text(scheme)


def plugin_resources(variants, author, title):
    plugin = ET.Element("idea-plugin")
    for key, value in {
        "id": "theme.karazuri.jetbrains", "name": "karazuri", "version": "0.1.0", "vendor": author,
        "description": "karazuri color themes in Umi, Yoru, and Kami.",
        "depends": "com.intellij.modules.platform",
    }.items():
        ET.SubElement(plugin, key).text = value
    # The installable archive targets current and recent IntelliJ Platform releases.
    ET.SubElement(plugin, "idea-version", {"since-build": "243"})
    extensions = ET.SubElement(plugin, "extensions", defaultExtensionNs="com.intellij")
    files = {}

    for name, variant in variants.items():
        c = variant["colors"]
        dark = variant["appearance"] == "dark"
        path = f"themes/karazuri-{name}"
        ET.SubElement(extensions, "themeProvider", id=f"theme.karazuri.jetbrains.{name}",
                      path=f"/{path}.theme.json")
        theme = {
            "name": title(name), "dark": dark, "author": author,
            "editorScheme": f"/{path}.xml",
            "ui": {
                "*": {
                    "background": c["bg"], "foreground": c["fg"],
                    "selectionBackground": c["visual"], "selectionForeground": c["fg"],
                    "inactiveBackground": c["bg_m1"], "inactiveForeground": c["fg_dim"],
                    "disabledBackground": c["bg_m1"], "disabledForeground": c["comment"],
                    "borderColor": c["border"], "focusColor": c["func"],
                },
                "Component": {"focusedBorderColor": c["func"]},
                "EditorTabs": {
                    "background": c["bg0"], "selectedBackground": c["bg"],
                    "selectedForeground": c["fg"], "underlineColor": c["func"],
                },
                "ToolWindow": {
                    "Header.background": c["bg_m1"], "Header.inactiveBackground": c["bg0"],
                    "Button.selectedBackground": c["visual"],
                },
            },
        }
        files[f"{path}.theme.json"] = json.dumps(theme, indent=2) + "\n"
        files[f"{path}.xml"] = editor_scheme(title(name), c, dark)
    files["META-INF/plugin.xml"] = xml_text(plugin)
    return files


def package_plugin(resources):
    archive = io.BytesIO()
    with zipfile.ZipFile(archive, "w") as jar:
        jar.writestr(zipfile.ZipInfo("META-INF/MANIFEST.MF"), "Manifest-Version: 1.0\r\n\r\n")
        for path, data in sorted(resources.items()):
            entry = zipfile.ZipInfo(path)
            jar.writestr(entry, data)
    return archive.getvalue()
