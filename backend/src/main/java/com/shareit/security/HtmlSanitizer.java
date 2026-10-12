package com.shareit.security;

import java.util.regex.Pattern;

/**
 * High-performance HTML Sanitization utility designed to prevent Stored Cross-Site Scripting (XSS).
 * Automatically detects and strips dangerous executable tags, embedded scripts, inline event handlers,
 * and pseudo-protocol attack vectors from user-supplied text before persistence.
 */
public final class HtmlSanitizer {

    private HtmlSanitizer() {
        // Utility class
    }

    // Matches paired executable/script/embed tags and their inner content
    private static final Pattern SCRIPT_TAG_PATTERN = Pattern.compile(
            "<(script|iframe|object|embed|applet|form|style)[^>]*>.*?</\\1>",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // Matches standalone / self-closing dangerous tags
    private static final Pattern SELF_CLOSING_DANGEROUS_TAGS = Pattern.compile(
            "<(script|iframe|object|embed|applet|form|base|meta|link)[^>]*/?>",
            Pattern.CASE_INSENSITIVE
    );

    // Matches inline HTML event handlers (e.g. onerror=, onload=, onclick=, onmouseover=)
    private static final Pattern EVENT_HANDLER_PATTERN = Pattern.compile(
            "\\s+on[a-zA-Z]+\\s*=\\s*(['\"][^'\"]*['\"]|[^\\s>]+)",
            Pattern.CASE_INSENSITIVE
    );

    // Matches pseudo-protocols like javascript: or data:text/html
    private static final Pattern PSEUDO_PROTOCOL_PATTERN = Pattern.compile(
            "(javascript|vbscript|data\\s*:\\s*text/html)\\s*:",
            Pattern.CASE_INSENSITIVE
    );

    // Matches any remaining raw HTML tags
    private static final Pattern HTML_TAG_PATTERN = Pattern.compile(
            "<[^>]+>",
            Pattern.DOTALL
    );

    /**
     * Sanitizes user input by removing all executable scripts, iframes, inline event handlers,
     * dangerous URL schemes, and rogue HTML tags to guarantee safe plain text storage.
     *
     * @param input Raw user-submitted string
     * @return Sanitized safe text, or null if input was null
     */
    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }

        String cleaned = input;

        // 1. Strip script/iframe/object blocks including their inner code
        cleaned = SCRIPT_TAG_PATTERN.matcher(cleaned).replaceAll("");

        // 2. Strip single/self-closing dangerous tags
        cleaned = SELF_CLOSING_DANGEROUS_TAGS.matcher(cleaned).replaceAll("");

        // 3. Strip inline event handlers (e.g. onerror=, onload=)
        cleaned = EVENT_HANDLER_PATTERN.matcher(cleaned).replaceAll("");

        // 4. Strip javascript: and vbscript: pseudo-protocols
        cleaned = PSEUDO_PROTOCOL_PATTERN.matcher(cleaned).replaceAll("");

        // 5. Strip any leftover HTML markup tags
        cleaned = HTML_TAG_PATTERN.matcher(cleaned).replaceAll("");

        return cleaned.trim();
    }
}
