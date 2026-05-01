import { customerApi } from "@/shared/config/api";
import type { Locale } from "@/shared/providers/i18n-provider";

export type TranslateFormat = "text" | "html";

const STORAGE_KEY = "danang-paragliding.translate-cache.v2";
const MAX_STORAGE_ITEMS = 400;
const TRANSLATE_BATCH_SIZE = 1;
const TRANSLATE_BATCH_MAX_CHARS = 1200;
const TRANSLATE_QUEUE_DELAY_MS = 50;
const LONG_TEXT_MAX_CHARS = 1200;

let storageLoaded = false;
const memoryCache = new Map<string, string>();

const loadStorageCache = () => {
  if (storageLoaded || typeof window === "undefined") {
    return;
  }

  storageLoaded = true;

  try {
    const payload = window.localStorage.getItem(STORAGE_KEY);
    const entries = payload ? (JSON.parse(payload) as Array<[string, string]>) : [];
    for (const [key, value] of entries) {
      if (typeof key === "string" && typeof value === "string") {
        memoryCache.set(key, value);
      }
    }
  } catch {
    memoryCache.clear();
  }
};

const persistStorageCache = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const entries = Array.from(memoryCache.entries()).slice(-MAX_STORAGE_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Cache persistence is best-effort only.
  }
};

const hashText = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const cacheKey = (source: Locale, target: Locale, format: TranslateFormat, text: string) =>
  `${source}:${target}:${format}:${text.length}:${hashText(text)}`;

type QueueItem = {
  text: string;
  resolve: (value: TranslationOutcome) => void;
};

type TranslationOutcome = {
  text: string;
  ok: boolean;
};

type QueueGroup = {
  source: Locale;
  target: Locale;
  format: TranslateFormat;
  items: QueueItem[];
  timer: number | null;
  flushing: boolean;
};

const queueGroups = new Map<string, QueueGroup>();

const queueGroupKey = (source: Locale, target: Locale, format: TranslateFormat) => `${source}:${target}:${format}`;

const takeNextBatch = (items: QueueItem[]) => {
  const batch: QueueItem[] = [];
  let totalCharacters = 0;

  while (items.length > 0 && batch.length < TRANSLATE_BATCH_SIZE) {
    const nextItem = items[0];
    const nextLength = nextItem.text.length;

    if (batch.length > 0 && totalCharacters + nextLength > TRANSLATE_BATCH_MAX_CHARS) {
      break;
    }

    batch.push(items.shift() as QueueItem);
    totalCharacters += nextLength;

    if (nextLength >= TRANSLATE_BATCH_MAX_CHARS) {
      break;
    }
  }

  return batch;
};

const flushQueueGroup = async (groupKey: string) => {
  const group = queueGroups.get(groupKey);
  if (!group || group.flushing) {
    return;
  }

  group.flushing = true;
  group.timer = null;

  while (group.items.length > 0) {
    const batch = takeNextBatch(group.items);

    try {
      const payload = await customerApi.translate({
        q: batch.map((item) => item.text),
        source: group.source,
        target: group.target,
        format: group.format
      });

      batch.forEach((item, index) => item.resolve({ text: payload.translations[index] ?? item.text, ok: true }));
    } catch {
      batch.forEach((item) => item.resolve({ text: item.text, ok: false }));
    }
  }

  group.flushing = false;
  queueGroups.delete(groupKey);
};

const enqueueTranslation = (text: string, source: Locale, target: Locale, format: TranslateFormat) =>
  new Promise<TranslationOutcome>((resolve) => {
    const key = queueGroupKey(source, target, format);
    const group =
      queueGroups.get(key) ??
      {
        source,
        target,
        format,
        items: [],
        timer: null,
        flushing: false
      };

    group.items.push({ text, resolve });

    if (!queueGroups.has(key)) {
      queueGroups.set(key, group);
    }

    if (group.timer === null && !group.flushing) {
      group.timer = window.setTimeout(() => {
        void flushQueueGroup(key);
      }, TRANSLATE_QUEUE_DELAY_MS);
    }
  });

const splitPlainTextIntoChunks = (text: string, maxCharacters = LONG_TEXT_MAX_CHARS) => {
  if (text.length <= maxCharacters) {
    return [text];
  }

  const chunks: string[] = [];
  let remainingText = text;

  while (remainingText.length > maxCharacters) {
    const windowText = remainingText.slice(0, maxCharacters + 1);
    const splitIndex = Math.max(
      windowText.lastIndexOf("\n\n"),
      windowText.lastIndexOf(". "),
      windowText.lastIndexOf("! "),
      windowText.lastIndexOf("? "),
      windowText.lastIndexOf("; "),
      windowText.lastIndexOf(", "),
      windowText.lastIndexOf(" ")
    );
    const cutIndex = splitIndex > Math.floor(maxCharacters * 0.45) ? splitIndex + 1 : maxCharacters;

    chunks.push(remainingText.slice(0, cutIndex));
    remainingText = remainingText.slice(cutIndex);
  }

  if (remainingText) {
    chunks.push(remainingText);
  }

  return chunks;
};

const splitHtmlIntoBlocks = (html: string) => {
  const blockPattern = /<(p|h[1-6]|li|blockquote|div|section|article|figure|figcaption)\b[^>]*>[\s\S]*?<\/\1>/gi;
  const blocks: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(html)) !== null) {
    if (match.index > lastIndex) {
      blocks.push(html.slice(lastIndex, match.index));
    }
    blocks.push(match[0]);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < html.length) {
    blocks.push(html.slice(lastIndex));
  }

  return blocks.filter((block) => block.length > 0);
};

const packChunks = (parts: string[], maxCharacters = LONG_TEXT_MAX_CHARS) => {
  const chunks: string[] = [];
  let currentChunk = "";

  parts.forEach((part) => {
    if (part.length > maxCharacters) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }
      chunks.push(...splitPlainTextIntoChunks(part, maxCharacters));
      return;
    }

    if (currentChunk && currentChunk.length + part.length > maxCharacters) {
      chunks.push(currentChunk);
      currentChunk = part;
      return;
    }

    currentChunk += part;
  });

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

const splitTranslatableText = (text: string, format: TranslateFormat) => {
  if (text.length <= LONG_TEXT_MAX_CHARS) {
    return [text];
  }

  if (format === "html") {
    return packChunks(splitHtmlIntoBlocks(text));
  }

  return splitPlainTextIntoChunks(text);
};

const translateText = async (text: string, source: Locale, target: Locale, format: TranslateFormat) => {
  const chunks = splitTranslatableText(text, format);

  if (chunks.length === 1) {
    return enqueueTranslation(text, source, target, format);
  }

  const translatedChunks = await Promise.all(chunks.map((chunk) => enqueueTranslation(chunk, source, target, format)));
  return {
    text: translatedChunks.map((chunk) => chunk.text).join(""),
    ok: translatedChunks.every((chunk) => chunk.ok)
  };
};

export const translateTexts = async (
  texts: string[],
  {
    source = "vi",
    target,
    format = "text"
  }: {
    source?: Locale;
    target: Locale;
    format?: TranslateFormat;
  }
) => {
  if (source === target) {
    return texts;
  }

  loadStorageCache();

  const result = [...texts];
  const pendingIndexes: number[] = [];
  const pendingTexts: string[] = [];

  texts.forEach((text, index) => {
    if (!text.trim()) {
      return;
    }

    const key = cacheKey(source, target, format, text);
    const cached = memoryCache.get(key);
    if (cached !== undefined) {
      result[index] = cached;
      return;
    }

    pendingIndexes.push(index);
    pendingTexts.push(text);
  });

  if (pendingTexts.length === 0) {
    return result;
  }

  const translatedTexts = await Promise.all(pendingTexts.map((text) => translateText(text, source, target, format)));

  translatedTexts.forEach((translatedText, pendingIndex) => {
    const originalIndex = pendingIndexes[pendingIndex];
    result[originalIndex] = translatedText.text;
    if (translatedText.ok) {
      memoryCache.set(cacheKey(source, target, format, texts[originalIndex]), translatedText.text);
    }
  });

  persistStorageCache();

  return result;
};
