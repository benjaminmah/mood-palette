// JavaScript to handle color selection and drawing on canvas

// Get all color selectors
const colorSelectors = document.querySelectorAll('.color-selector');

// Add click event listener to each color selector
colorSelectors.forEach(colorSelector => {
  colorSelector.addEventListener('click', () => {
    // Check if the color selector is already selected
    const isSelected = colorSelector.classList.contains('selected');

    // Remove 'selected' class from all color selectors
    colorSelectors.forEach(selector => {
      selector.classList.remove('selected');
    });

    // Add 'selected' class to the clicked color selector if it was not already selected
    if (!isSelected) {
      colorSelector.classList.add('selected');
    }
  });
});

const saveButton = document.querySelector(".save-button");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

let isDrawing = false;
let previousX, previousY;

// Get the brush size input element
const brushSizeInput = document.getElementById("brushSize");

// Set the initial brush size
let brushSize = brushSizeInput.value;

// Add change event listener to the brush size input
brushSizeInput.addEventListener("input", () => {
  // Update the brush size when the input value changes
  brushSize = brushSizeInput.value;
});

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);

function startDrawing(event) {
  isDrawing = true;
  const { offsetX, offsetY } = event;
  previousX = offsetX;
  previousY = offsetY;
}

function draw(event) {
  if (!isDrawing) return;

  const { offsetX, offsetY } = event;

  if (brushSize > 0) {
    if (isEraserSelected()) {
      erase(offsetX, offsetY);
    } else {
      drawLine(offsetX, offsetY);
    }
  }
}

function stopDrawing() {
  isDrawing = false;
}

function drawLine(offsetX, offsetY) {
  const colorSelector = document.querySelector('.color-selector.selected');
  const color = window.getComputedStyle(colorSelector).getPropertyValue('background-color');

  context.strokeStyle = color;
  context.lineWidth = brushSize; // Set the brush size
  context.lineCap = "round";

  context.beginPath();
  context.moveTo(previousX, previousY);
  context.lineTo(offsetX, offsetY);
  context.stroke();

  previousX = offsetX;
  previousY = offsetY;
}

function erase(offsetX, offsetY) {
    const eraseSize = Math.abs(brushSize); // Use absolute value to ensure positive size
  
    context.save(); // Save the current canvas state
    context.globalCompositeOperation = 'destination-out'; // Set the composite operation to erase
  
    context.lineWidth = eraseSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(previousX, previousY);
    context.lineTo(offsetX, offsetY);
    context.stroke();
  
    context.restore(); // Restore the canvas state
  
    previousX = offsetX;
    previousY = offsetY;
  }
  

function isEraserSelected() {
  const eraserButton = document.querySelector('.eraser');
  return eraserButton.classList.contains('selected');
}

saveButton.addEventListener("click", () => {
  // Create a new canvas element
  const newCanvas = document.createElement("canvas");
  const newContext = newCanvas.getContext("2d");

  // Set the dimensions of the new canvas to match the original canvas
  newCanvas.width = canvas.width;
  newCanvas.height = canvas.height;

  // Fill the new canvas with a white background
  newContext.fillStyle = "#fff";
  newContext.fillRect(0, 0, newCanvas.width, newCanvas.height);

  // Draw the original canvas on top of the new canvas
  newContext.drawImage(canvas, 0, 0);

  // Convert the new canvas to an image data URL
  const dataURL = newCanvas.toDataURL("image/png");

  // Create a link element
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "artwork.png";
  link.target = "_blank";

  // Trigger click event on the link element to download the image
  link.click();
});


const clearButton = document.querySelector(".clear-button");

clearButton.addEventListener("click", () => {
  // Clear the canvas by filling it with a white background
  context.fillStyle = "#eee7dc";
  context.fillRect(0, 0, canvas.width, canvas.height);
});
