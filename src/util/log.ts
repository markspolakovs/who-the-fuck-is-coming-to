export function logAction(action: any, whomst?: string) {
  console.group(
    (typeof whomst === "string" ? `[${whomst}] ` : "") + action.type
  );
  for (const key in action) {
    if (key === "type") {
      continue;
    }
    console.log(
      `%c${key}: %c${(action as any)[key]}`,
      "color: #444",
      "color: #000"
    );
  }
  console.groupEnd();
}
