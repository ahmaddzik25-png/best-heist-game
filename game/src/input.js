// MIDNIGHT VAULT - keyboard and mouse state. The game reads plain
// fields off this object every frame; listeners only record what is
// held and where the mouse is, in canvas coordinates.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    clicked: null, // {x, y} for one frame after a click
    anyKey: false, // set for one frame on any key press
  };

  const toCanvas = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    input.keys.add(event.key.toLowerCase());
    input.anyKey = true;
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('mousemove', (event) => {
    const p = toCanvas(event);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    input.clicked = toCanvas(event);
  });

  input.held = (...names) => names.some((n) => input.keys.has(n));
  input.endFrame = () => {
    input.clicked = null;
    input.anyKey = false;
  };
  return input;
}
