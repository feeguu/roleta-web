/**
 *
 * @param {HTMLCanvasElement} canvas
 */
export function setupRoulette(canvas, stopCallback) {
  const context = canvas.getContext("2d");

  function clear() {
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  let lastFrame = 0;

  const defaultSlotMovement = 1200;

  let totalLoopTimes = 0;
  let slotMovement = 0;
  let stopping = false;
  let currentSlot = 0;

  let callbackCalled = false;

  let targetNumber = 0;

  const targetRectangleWidth = 4;
  const slotCount = 37;
  const slotSize = 96;
  canvas.width = slotSize * 9;
  canvas.height = slotSize;
  const slots = [];

  let reachedAnimationRunning = false;
  let randomReachedAddition = getRandomNumber(-100, 100);

  for (let i = 0; i < slotCount; i++) {
    let color = "#" + (i % 2 == 0 ? "171717" : "dc2626");

    if (i == 0) color = "#16a34a";

    slots.push({ x: i * slotSize, number: i, color });
  }

  function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   *
   * @param {number} n
   */
  function spin(n) {
    targetNumber = n;
    slotMovement = defaultSlotMovement;
    totalLoopTimes = 0;
    stopping = false;
    randomReachedAddition = getRandomNumber(-1, 1) * 100;
    reachedAnimationRunning = false;
  }

  function draw(currentFrame) {
    const deltaTime = (currentFrame - lastFrame) / 1000;

    lastFrame = currentFrame;

    if (stopping) {
      const diff = targetNumber - currentSlot;

      if (diff <= 3) reachedAnimationRunning = true;

      if (reachedAnimationRunning) {
        slotMovement = Math.max(
          slotMovement - (2500 + randomReachedAddition) * deltaTime,
          0
        );

        if (slotMovement == 0 && !callbackCalled) {
          stopCallback();
          callbackCalled = true;
        }
      }
    }

    for (let slotIndex in slots) {
      slotIndex = parseInt(slotIndex);
      const slot = slots[slotIndex];

      slot.x -= slotMovement * deltaTime;

      if (slot.x < -slotSize) {
        slot.x += slotSize * slotCount;
        currentSlot = slots[(slotIndex + 5) % slotCount].number;

        if (currentSlot == 0) {
          totalLoopTimes++;

          if (totalLoopTimes >= 3) {
            stopping = true;
          }
        }
      }
    }

    clear();

    context.font = "24px monospace";

    for (const slot of slots) {
      context.fillStyle = slot.color;
      context.fillRect(Math.floor(slot.x), 0, Math.ceil(slotSize), slotSize);

      context.fillStyle = "#f5f5f5";
      context.fillText(slot.number, Math.floor(slot.x) + 24, 32);
    }

    context.fillStyle = "#f5f5f5";
    context.fillRect(
      canvas.width / 2 - targetRectangleWidth / 2,
      0,
      targetRectangleWidth,
      slotSize
    );

    // context.fillText(currentSlot, canvas.width / 2 - 32, 32)

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);

  return { spin };
}
