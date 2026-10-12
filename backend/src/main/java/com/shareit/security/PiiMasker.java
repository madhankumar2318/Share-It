package com.shareit.security;

/**
 * Utility for masking Personally Identifiable Information (PII)
 * such as phone numbers and email addresses to protect user privacy from public scraping.
 */
public final class PiiMasker {

    private PiiMasker() {
        // Utility class
    }

    /**
     * Masks a phone number for public display.
     * Examples:
     * - "9876543210" -> "98****3210"
     * - "+91 9876543210" -> "+91 98****3210"
     * - "+919876543210" -> "+91 98****3210"
     * - "12345" -> "****"
     *
     * @param phone Raw phone number string
     * @return Masked phone string, or null if input was null/blank
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }

        String cleaned = phone.trim();
        int len = cleaned.length();

        if (len <= 6) {
            return "****" + (len >= 2 ? cleaned.substring(len - 2) : "");
        }

        // Preserve "+91 " or country code prefix if present
        if (cleaned.startsWith("+")) {
            int spaceIdx = cleaned.indexOf(' ');
            if (spaceIdx > 0 && spaceIdx < len - 4) {
                String prefix = cleaned.substring(0, spaceIdx + 1);
                String rest = cleaned.substring(spaceIdx + 1);
                return prefix + maskSimpleNumber(rest);
            }
        }

        return maskSimpleNumber(cleaned);
    }

    private static String maskSimpleNumber(String number) {
        int len = number.length();
        if (len <= 6) {
            return "****" + number.substring(Math.max(0, len - 2));
        }

        // Show first 2 digits and last 4 digits (e.g. 98****3210)
        String start = number.substring(0, 2);
        String end = number.substring(len - 4);
        return start + "****" + end;
    }

    /**
     * Masks an email address for public display.
     * Example: "kumarmathan@gmail.com" -> "ku***@gmail.com"
     */
    public static String maskEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return null;
        }

        String cleaned = email.trim();
        int atIndex = cleaned.indexOf('@');
        if (atIndex <= 1) {
            return "***" + (atIndex >= 0 ? cleaned.substring(atIndex) : "");
        }

        String localPart = cleaned.substring(0, atIndex);
        String domainPart = cleaned.substring(atIndex);

        if (localPart.length() <= 3) {
            return localPart.charAt(0) + "***" + domainPart;
        }

        return localPart.substring(0, 2) + "***" + domainPart;
    }
}
