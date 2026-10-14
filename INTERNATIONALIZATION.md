# Internationalization

EduForge AI's authenticated dashboard includes an English/Urdu toggle in the top navigation. English (`en`) is the default and Urdu (`ur`) switches the document direction to RTL.

- The selected locale is written to `localStorage` immediately and saved to the authenticated user's existing `profiles.preferred_language` field (`English` or `Urdu`) through a rate-limited, ownership-checked server action.
- The provider reads the profile language when no local preference exists and safely falls back to English if a profile is missing.
- Urdu uses the available system Noto Arabic/Nastaliq Urdu font fallbacks; the dark theme is unchanged.
- Chat sends the validated locale to the authenticated API. The tutor is instructed to answer in the selected language while preserving code, formulas, URLs, citations, and PDF/source citation markers. Uploaded PDF contents and citations are never translated.
- Static dashboard and chat labels are translated through the typed `t()` dictionary/context. User names, course content, activity labels, messages, and other dynamic generated content are not automatically translated; newly generated tutor content follows the selected language.

Only English and Urdu are controlled by the toggle. Existing profile language choices remain available for compatibility, but they do not change the dashboard locale.
