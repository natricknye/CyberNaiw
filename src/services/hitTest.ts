export interface PointLike {
  clientX: number;
  clientY: number;
  target: EventTarget | null;
}

const imageAlphaCache = new Map<string, CanvasRenderingContext2D>();

function isOpaqueImagePoint(
  image: HTMLImageElement,
  point: PointLike,
): boolean {
  const rect = image.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || image.naturalWidth === 0) {
    return false;
  }

  const x = Math.floor(
    ((point.clientX - rect.left) / rect.width) * image.naturalWidth,
  );
  const y = Math.floor(
    ((point.clientY - rect.top) / rect.height) * image.naturalHeight,
  );
  if (x < 0 || y < 0 || x >= image.naturalWidth || y >= image.naturalHeight) {
    return false;
  }

  const source = image.currentSrc || image.src;
  let context = imageAlphaCache.get(source);
  if (!context) {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const nextContext = canvas.getContext("2d", { willReadFrequently: true });
    if (!nextContext) {
      return false;
    }
    nextContext.drawImage(image, 0, 0);
    context = nextContext;
    imageAlphaCache.set(source, context);
  }

  return context.getImageData(x, y, 1, 1).data[3] > 16;
}

/**
 * Only non-transparent character cells/images count as the pet.
 * Transparent margins, the bubble, HUD and shadow are click-through.
 */
export function isCharacterPoint(point: PointLike): boolean {
  const target = point.target;
  if (!(target instanceof Element)) {
    return false;
  }

  if (target.closest('.pet-ascii [class^="tone-"]:not(.tone-empty)')) {
    return true;
  }

  const image = target.closest(".pet-visual--image img");
  return image instanceof HTMLImageElement && isOpaqueImagePoint(image, point);
}

/** Hit-test a client-space point without a DOM event. */
export function isCharacterPointAt(clientX: number, clientY: number): boolean {
  return isCharacterPoint({
    clientX,
    clientY,
    target: document.elementFromPoint(clientX, clientY),
  });
}
