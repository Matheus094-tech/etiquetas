const DIACRITICS_PATTERN = /[̀-ͯ]/g;

export function stripAccents(text: string): string {
  return text.normalize("NFD").replace(DIACRITICS_PATTERN, "");
}

export function slugify(text: string): string {
  return stripAccents(text)
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
