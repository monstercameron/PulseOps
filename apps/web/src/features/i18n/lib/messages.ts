type MessagePrimitive = boolean | null | number | string;
type MessageValue = MessagePrimitive | readonly MessageValue[] | MessageMap;
type MessageMap = {
  [key: string]: MessageValue;
};

function isMessageMap(value: unknown): value is MessageMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getMessageValue(messages: MessageMap, key: string) {
  return key.split(".").reduce<unknown>((current, segment) => {
    if (!isMessageMap(current)) {
      return undefined;
    }

    return current[segment];
  }, messages);
}

export function interpolateMessage(
  template: string,
  values?: Readonly<Record<string, boolean | number | string>>,
) {
  if (values === undefined) {
    return template;
  }

  return template.replaceAll(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? "" : String(value);
  });
}

export function resolveTranslatedValue<T>(defaults: T, override: unknown): T {
  if (
    typeof defaults === "string" ||
    typeof defaults === "number" ||
    typeof defaults === "boolean" ||
    defaults === null
  ) {
    return (override ?? defaults) as T;
  }

  if (Array.isArray(defaults)) {
    const overrideArray = Array.isArray(override) ? override : [];
    return defaults.map((value, index) =>
      resolveTranslatedValue(value, overrideArray[index]),
    ) as T;
  }

  if (typeof defaults === "object" && defaults !== null) {
    const overrideObject = isMessageMap(override) ? override : {};
    return Object.fromEntries(
      Object.entries(defaults).map(([key, value]) => [
        key,
        resolveTranslatedValue(value, overrideObject[key]),
      ]),
    ) as T;
  }

  return defaults;
}

export function resolveTranslatedBranch<T>(
  messages: MessageMap,
  key: string,
  defaults: T,
) {
  return resolveTranslatedValue(defaults, getMessageValue(messages, key));
}

export function translateMessage(
  messages: MessageMap,
  key: string,
  fallback: string,
  values?: Readonly<Record<string, boolean | number | string>>,
) {
  const messageValue = getMessageValue(messages, key);
  const template = typeof messageValue === "string" ? messageValue : fallback;

  return interpolateMessage(template, values);
}

export type { MessageMap, MessageValue };
