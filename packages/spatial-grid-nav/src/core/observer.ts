export class DOMObserver {
  private root: HTMLElement;
  private onInvalidate: () => void;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(root: HTMLElement, onInvalidate: () => void) {
    this.root = root;
    this.onInvalidate = onInvalidate;
  }

  observe(): void {
    this.mutationObserver = new MutationObserver(() => {
      this.onInvalidate();
    });

    this.mutationObserver.observe(this.root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        "data-sgn-group",
        "data-sgn-section",
        "data-sgn-capture",
        "hidden",
        "aria-hidden",
        "disabled",
      ],
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.onInvalidate();
    });

    this.resizeObserver.observe(this.root);
  }

  disconnect(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}
