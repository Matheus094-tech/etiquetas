function fetchAsDataUrl(url: string): Promise<string> {
  return fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`Falha ao carregar o asset ${url}.`);
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error(`Falha ao ler o asset ${url}.`));
          reader.readAsDataURL(blob);
        })
    );
}

/**
 * Returns a clone of `svg` with every `<image href="...">` pointing at a
 * local file replaced by an embedded base64 data URL, so the resulting tree
 * (and anything exported from it) no longer depends on the site being
 * online or reachable — the label's official template, logo and
 * illustration are baked directly into the file.
 */
export async function embedSvgImages(svg: SVGSVGElement): Promise<SVGSVGElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const images = Array.from(clone.querySelectorAll("image"));

  const hrefs = new Set<string>();
  for (const image of images) {
    const href = image.getAttribute("href");
    if (href && !href.startsWith("data:")) hrefs.add(href);
  }

  const dataUrlByHref = new Map<string, string>();
  await Promise.all(
    Array.from(hrefs).map(async (href) => {
      dataUrlByHref.set(href, await fetchAsDataUrl(href));
    })
  );

  for (const image of images) {
    const href = image.getAttribute("href");
    const dataUrl = href ? dataUrlByHref.get(href) : undefined;
    if (dataUrl) {
      image.setAttribute("href", dataUrl);
      image.removeAttribute("xlink:href");
    }
  }

  return clone;
}
