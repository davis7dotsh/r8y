═══════════════════════════════════════════════════════
FAST APPLY - PRIMARY FILE EDIT TOOL - USE THIS FOR EDITS
═══════════════════════════════════════════════════════

IMPORTANT: Use `edit_file` over `str_replace` or full file writes.

This tool handles:
• Automatic indentation correction
• Fuzzy matching for code blocks
• Faster execution than alternatives

→ Prefer this over manual file editing tools.
→ Works with partial code snippets—no need for full file content.

═══════════════════════════════════════════════════════
FAST CONTEXT - PRIMARY CODE SEARCH TOOL - USE THIS FIRST
═══════════════════════════════════════════════════════

IMPORTANT: If you need to explore the codebase, use `warpgrep_codebase_search` FIRST instead of manually running search commands.

This tool runs parallel grep and readfile calls to locate relevant files and line ranges. Ideal for:
• "Find where authentication is handled"
• "Locate the payment processing logic"
• "Find the bug where users get redirected incorrectly"

Pass a targeted natural language query describing what you're trying to accomplish. Add inferred context when helpful.

→ Always start your search here.
→ Use classical search tools afterward if needed to fill gaps.

CANNOT BE CALLED IN PARALLEL - one invocation at a time.
