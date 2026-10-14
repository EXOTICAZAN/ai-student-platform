import { describe, expect, it } from "vitest";
import { isLocale, messages, profileLanguageToLocale } from "@/lib/i18n";

describe("dashboard locales", () => {
  it("validates only English and Urdu locale codes", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ur")).toBe(true);
    expect(isLocale("ar")).toBe(false);
  });

  it("maps stored profile language names safely", () => {
    expect(profileLanguageToLocale("Urdu")).toBe("ur");
    expect(profileLanguageToLocale("ur")).toBe("ur");
    expect(profileLanguageToLocale(undefined)).toBe("en");
  });

  it("has translated shell labels and preserves RTL locale selection", () => {
    expect(messages.en.dashboard).toBe("Dashboard");
    expect(messages.ur.dashboard).toBe("ڈیش بورڈ");
    expect(messages.ur.urdu).toBe("اردو");
  });
});
