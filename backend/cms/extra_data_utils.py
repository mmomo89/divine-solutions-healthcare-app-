import re


def humanize_key(key: str) -> str:
    """Turns a form field key into a readable label, handling both
    snake_case (employment_history) and camelCase (jobTitle, datesFrom) --
    the careers form's raw field state uses camelCase, while a few fields
    the frontend renames before submitting use snake_case, so both need
    to look right."""
    spaced = re.sub(r"(?<!^)(?=[A-Z])", " ", key)  # camelCase -> "camel Case"
    spaced = spaced.replace("_", " ")
    return spaced.title()


def format_extra_value(val, multiline=False):
    """Formats a FormSubmission.extra_data value for human display.

    extra_data is a free-form JSONField, so its values can be plain
    strings/numbers, booleans, a list of strings (e.g. checkbox selections
    like ethnicity or desired employment type), or a list of dicts (e.g.
    the careers form's repeated employment-history entries). Naively doing
    str(val) or an f-string on a list-of-dicts produces Python's dict/list
    repr, which reads as raw JSON-like text to anyone looking at it -- this
    formats each shape properly instead.

    multiline=True joins multi-entry lists with real newlines (for PDF/plain
    -text email); multiline=False joins with "; " (for a single HTML table
    cell / one-line context).
    """
    if val is None or val == "":
        return "\u2014"
    if isinstance(val, bool):
        return "Yes" if val else "No"
    if isinstance(val, list):
        if not val:
            return "\u2014"
        if isinstance(val[0], dict):
            entries = []
            for i, entry in enumerate(val, 1):
                fields = [
                    f"{humanize_key(k)}: {v}"
                    for k, v in entry.items() if v not in (None, "")
                ]
                if fields:
                    entries.append(f"#{i} \u2014 " + "; ".join(fields))
            joiner = "\n" if multiline else "  |  "
            return joiner.join(entries) if entries else "\u2014"
        # list of plain strings (checkbox-style selections)
        return ", ".join(str(v) for v in val)
    return str(val)
