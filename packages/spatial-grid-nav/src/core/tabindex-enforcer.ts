/**
 * TabIndexEnforcer
 *
 * Removes native tabbability from all interactive elements within a scope
 * by setting tabindex="-1". This makes the browser's native Tab/Shift+Tab
 * a no-op, which sidesteps WebKitGTK's bug where preventDefault() is
 * ignored on Shift+Tab keydown events.
 *
 * Programmatic focus (element.focus()) still works on tabindex="-1" elements
 * per the HTML spec, so the navigation engine's cycleItem/enterGroup/
 * activateGroup continue to function normally.
 */

const TABBABLE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "[tabindex]",
].join(", ");

const PORTAL_SELECTOR = "[data-floating-portal]";

export class TabIndexEnforcer {
  private originals = new Map<HTMLElement, string | null>();
  private observer: MutationObserver | null = null;
  private scope: HTMLElement | null = null;

  enforce(scope: HTMLElement): void {
    this.restore();
    this.scope = scope;
    this.suppressAll(scope);

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
              this.suppressElement(node);
              this.suppressAll(node);
            }
          }
        } else if (
          mutation.type === "attributes" &&
          mutation.attributeName === "tabindex" &&
          mutation.target instanceof HTMLElement
        ) {
          this.suppressElement(mutation.target);
        }
      }
    });

    this.observer.observe(scope, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["tabindex"],
    });
  }

  restore(): void {
    this.observer?.disconnect();
    this.observer = null;

    for (const [el, original] of this.originals) {
      if (original === null) {
        el.removeAttribute("tabindex");
      } else {
        el.setAttribute("tabindex", original);
      }
    }
    this.originals.clear();
    this.scope = null;
  }

  private suppressAll(root: HTMLElement): void {
    const elements = root.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR);
    for (const el of elements) {
      this.suppressElement(el);
    }
  }

  private suppressElement(el: HTMLElement): void {
    // Skip elements inside floating portals (dropdown/select menus)
    if (el.closest(PORTAL_SELECTOR)) return;

    // Skip if not matched by our selector
    if (!el.matches(TABBABLE_SELECTOR)) return;

    // Already suppressed — no-op to prevent infinite observer loops
    if (el.getAttribute("tabindex") === "-1") return;

    // Save original only on first encounter
    if (!this.originals.has(el)) {
      const original = el.getAttribute("tabindex");
      this.originals.set(el, original);
    }

    el.setAttribute("tabindex", "-1");
  }
}
