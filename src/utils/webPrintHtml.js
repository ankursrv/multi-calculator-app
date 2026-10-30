/**
 * expo-print's web build prints the *current page*, so for the month sheet we
 * render the generated HTML into a hidden iframe and print that instead.
 */
export default function webPrintHtml(html) {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();

  // Give the browser a beat to lay out Devanagari glyphs before the dialog opens
  window.setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    window.setTimeout(() => {
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    }, 1000);
  }, 350);
}
