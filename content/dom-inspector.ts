// DOM Inspector - provides simplified view of interactive elements for Claude's reasoning

export function inspectPage(): any {
  const interactiveElements: any[] = [];

  // Find all inputs
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach((el, idx) => {
    const input = el as HTMLInputElement;
    if (input.offsetParent !== null) { // Only visible elements
      interactiveElements.push({
        type: 'input',
        tag: input.tagName.toLowerCase(),
        inputType: input.type || 'text',
        name: input.name || null,
        id: input.id || null,
        placeholder: input.placeholder || null,
        value: input.value ? '***' : '', // Don't expose actual values
        selector: generateSelector(input),
        label: findLabel(input),
        required: input.required
      });
    }
  });

  // Find all buttons
  const buttons = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
  buttons.forEach((el) => {
    const btn = el as HTMLElement;
    if (btn.offsetParent !== null) {
      interactiveElements.push({
        type: 'button',
        tag: btn.tagName.toLowerCase(),
        text: btn.textContent?.trim() || (btn as HTMLInputElement).value || null,
        id: btn.id || null,
        selector: generateSelector(btn)
      });
    }
  });

  // Find all links - prioritize navigation/menu links
  const links = document.querySelectorAll('a[href]');
  const priorityLinks: HTMLAnchorElement[] = [];
  const regularLinks: HTMLAnchorElement[] = [];

  links.forEach((el) => {
    const link = el as HTMLAnchorElement;
    if (link.offsetParent !== null) {
      const text = link.textContent?.trim().toLowerCase() || '';
      const isNav = link.closest('nav, .menu, .sidebar, header, .navigation') ||
                    text.includes('add') || text.includes('listing') ||
                    text.includes('create') || text.includes('new') ||
                    text.includes('edit') || text.includes('manage');

      if (isNav) {
        priorityLinks.push(link);
      } else {
        regularLinks.push(link);
      }
    }
  });

  // Add priority links first, then regular links up to limit
  [...priorityLinks, ...regularLinks].slice(0, 30).forEach((link) => {
    interactiveElements.push({
      type: 'link',
      text: link.textContent?.trim().substring(0, 60) || null,
      href: link.href,
      id: link.id || null,
      class: link.className || null,
      selector: generateSelector(link)
    });
  });

  return {
    url: window.location.href,
    title: document.title,
    elements: interactiveElements.slice(0, 30) // Limit to 30 most relevant elements
  };
}

function generateSelector(element: Element): string {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try name attribute
  const nameAttr = element.getAttribute('name');
  if (nameAttr) {
    const tag = element.tagName.toLowerCase();
    return `${tag}[name="${nameAttr}"]`;
  }

  // Try type for inputs
  if (element instanceof HTMLInputElement && element.type) {
    const typeSelector = `input[type="${element.type}"]`;
    if (document.querySelectorAll(typeSelector).length === 1) {
      return typeSelector;
    }
  }

  // Try class if unique
  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c && !c.match(/^(active|focus|hover|selected)/));
    if (classes.length > 0) {
      const selector = '.' + classes.join('.');
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }
  }

  // Fallback to nth-of-type
  let current: Element | null = element;
  const path: string[] = [];

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter(
        e => e.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;

    if (path.length > 4) break; // Keep selectors short
  }

  return path.join(' > ');
}

function findLabel(input: HTMLElement): string | null {
  // Check for associated label
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent?.trim() || null;
  }

  // Check for parent label
  const parentLabel = input.closest('label');
  if (parentLabel) {
    return parentLabel.textContent?.trim() || null;
  }

  // Check for nearby text
  const prev = input.previousElementSibling;
  if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN')) {
    return prev.textContent?.trim() || null;
  }

  return null;
}
