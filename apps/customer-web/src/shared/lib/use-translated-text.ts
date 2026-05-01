import { useEffect, useMemo, useState } from "react";

import { translateTexts, type TranslateFormat } from "@/shared/lib/translate";
import { repairVietnameseText, useI18n, type Locale } from "@/shared/providers/i18n-provider";

type UseTranslatedTextOptions = {
  source?: Locale;
  format?: TranslateFormat;
};

const normalizeSourceText = (value: string, format: TranslateFormat) =>
  format === "text" ? repairVietnameseText(value) : value;

export const useTranslatedText = (
  text: string,
  { source = "vi", format = "text" }: UseTranslatedTextOptions = {}
) => {
  const { locale, trackTranslationTask } = useI18n();
  const normalizedText = useMemo(() => normalizeSourceText(text, format), [format, text]);
  const [translatedText, setTranslatedText] = useState(normalizedText);

  useEffect(() => {
    let cancelled = false;

    if (!normalizedText.trim() || locale === source) {
      setTranslatedText(normalizedText);
      return () => {
        cancelled = true;
      };
    }

    trackTranslationTask(translateTexts([normalizedText], { source, target: locale, format }))
      .then(([nextText]) => {
        if (!cancelled) {
          setTranslatedText(nextText);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTranslatedText(normalizedText);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [format, locale, normalizedText, source, trackTranslationTask]);

  return translatedText;
};
