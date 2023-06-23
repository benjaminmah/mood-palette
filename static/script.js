window.addEventListener("load", () => {
  const popup = document.querySelector(".popup");
  popup.style.display = "none";
});

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
  const { clientX, clientY } = event;
  const { left, top, width, height } = canvas.getBoundingClientRect();
  const scaleX = canvas.width / width;
  const scaleY = canvas.height / height;
  previousX = (clientX - left) * scaleX;
  previousY = (clientY - top) * scaleY;
}

function draw(event) {
  if (!isDrawing) return;

  const { clientX, clientY } = event;
  const { left, top, width, height } = canvas.getBoundingClientRect();
  const scaleX = canvas.width / width;
  const scaleY = canvas.height / height;
  const offsetX = (clientX - left) * scaleX;
  const offsetY = (clientY - top) * scaleY;

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

const captureMoodButton = document.querySelector(".capture-mood-button");
const popup = document.querySelector(".popup");
const closeButton = document.querySelector(".close-button");

captureMoodButton.addEventListener("click", () => {
  const popup = document.querySelector(".popup");
  const popupContent = document.querySelector(".canvas-container");
  const popupCanvas = document.createElement("canvas");
  const popupContext = popupCanvas.getContext("2d");
  let videoStream = null; // Store the video stream
  let isCaptured = false; // Track whether an image is captured
  let isDetecting = false; // Track whether mood detection is in progress


  // Function to start the camera and draw video on the canvas
  const startCamera = () => {
    // Open camera and capture stream
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function (stream) {
        const video = document.createElement("video");
        videoStream = stream; // Store the video stream

        video.srcObject = stream;
        video.play();

        popupContent.innerHTML = ""; // Clear previous content
        popupContent.appendChild(popupCanvas);

        const drawVideoOnCanvas = () => {
          // Calculate the scale to fit the video within the canvas container
          const scale = Math.min(
            popupCanvas.width / video.videoWidth,
            popupCanvas.height / video.videoHeight
          );
          const width = video.videoWidth * scale;
          const height = video.videoHeight * scale;
          const x = (popupCanvas.width - width) / 2;
          const y = (popupCanvas.height - height) / 2;

          // Clear the canvas
          popupContext.clearRect(0, 0, popupCanvas.width, popupCanvas.height);

          // Flip the video horizontally using a transformation matrix
          popupContext.save();
          popupContext.scale(-1, 1);
          popupContext.translate(-popupCanvas.width, 0);

          // Draw the video onto the canvas
          popupContext.drawImage(video, x, y, width, height);

          popupContext.restore();

          requestAnimationFrame(drawVideoOnCanvas);
        };

        video.addEventListener("loadedmetadata", () => {
          popupCanvas.width = video.videoWidth;
          popupCanvas.height = video.videoHeight;

          drawVideoOnCanvas();
        });
      })
      .catch(function (error) {
        console.log("Unable to access camera: " + error);
      });
  };

  // Function to stop the camera
  const stopCamera = () => {
    if (videoStream) {
      const tracks = videoStream.getTracks();
      tracks.forEach((track) => track.stop());
      videoStream = null;
    }
  };

  // Function to capture an image from the camera feed
  const captureImage = () => {
    // Create a new canvas to hold the captured image
    const imageCanvas = document.createElement("canvas");
    const imageContext = imageCanvas.getContext("2d");

    // Set the dimensions of the image canvas to match the video dimensions
    imageCanvas.width = popupCanvas.width;
    imageCanvas.height = popupCanvas.height;

    // Draw the current frame of the video onto the image canvas
    imageContext.drawImage(popupCanvas, 0, 0, popupCanvas.width, popupCanvas.height);

    // Create an image element and set its source to the captured image data
    const capturedImage = new Image();
    capturedImage.src = imageCanvas.toDataURL();

    // Replace the camera feed with the captured image
    popupContent.innerHTML = "";
    popupContent.appendChild(capturedImage);

    // Replace the existing image element with the captured image
    const imgElement = document.querySelector("#popup .canvas-container img");
    imgElement.parentNode.replaceChild(capturedImage, imgElement);

    isCaptured = true; // Set the captured flag
  };

  // Function to send the captured image to Python for mood detection
  // Function to send the captured image to Python for mood detection
  const detectMood = () => {
    // Disable interaction with buttons during mood detection
    captureButton.disabled = true;
    retakeButton.disabled = true;
    detectButton.disabled = true;
    closeButton.disabled = true;
  
    // Change the text of the detect button to "Loading..."
    detectButton.textContent = "Loading...";
  
    // Get the captured image element
    const capturedImage = popupContent.querySelector(".canvas-container img");
  
    // Fetch the image data and convert it to Blob format
    fetch(capturedImage.src)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a new FormData object
        const formData = new FormData();
        formData.append("image", blob, "captured_image.png");
  
        // Send the image data to the Python server for mood detection
        fetch("/analyze_mood", { // Replace "/analyze_mood" with the actual endpoint URL of your Python server
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            // Handle the mood analysis results from the server
            const mood = data.mood;

            // Create the mood result element
            const moodResult = document.createElement("p");
            moodResult.textContent = `Detected Mood: ${mood}`;

            // Get the mood container element
            const moodContainer = document.getElementById("mood-container");

            // Clear any existing mood results
            moodContainer.innerHTML = "";

            // Append the mood result to the mood container
            moodContainer.appendChild(moodResult);

            // Update prompt based on mood
            const prompt = document.querySelector(".art-prompt");
            const h1Element = document.querySelector('h1');

            if (mood === "happy") {
              const Prompts = [
                "Draw a vibrant sunset over a serene beach scene.",
                "Create a colorful abstract composition that represents joy.",
                "Illustrate a bouquet of flowers in full bloom, radiating happiness.",
                "Draw a playful scene with children laughing and playing.",
                "Design a cheerful and whimsical character that spreads happiness."
              ];
              const randomPrompt = Prompts[Math.floor(Math.random() * Prompts.length)];
              prompt.textContent = randomPrompt;
              document.getElementById("color1").style.backgroundColor = "#FFD95B";
              document.getElementById("color2").style.backgroundColor = "#FFC26C";
              document.getElementById("color3").style.backgroundColor = "#FFA57C";
              document.getElementById("color4").style.backgroundColor = "#FF8C8C";
              document.getElementById("color5").style.backgroundColor = "#FF7171";
              document.body.style.backgroundColor = "#FFE8A1";
              h1Element.style.color = "#FF7171";
              prompt.style.color = "#FF7171";
            } else if (mood === "sad") {
              const Prompts = [
                "Create a self-portrait that captures your current mood.",
                "Illustrate a comforting scene or moment from your favorite book or movie.",
                "Draw a serene landscape that brings you a sense of peace.",
                "Express your emotions through abstract shapes and lines.",
                "Sketch a symbolic representation of hope and resilience.",
              ];
              const randomPrompt = Prompts[Math.floor(Math.random() * Prompts.length)];
              prompt.textContent = randomPrompt;
              document.getElementById("color1").style.backgroundColor = "#85C7E8";
              document.getElementById("color2").style.backgroundColor = "#6AA4C9";
              document.getElementById("color3").style.backgroundColor = "#5285AE";
              document.getElementById("color4").style.backgroundColor = "#3B668E";
              document.getElementById("color5").style.backgroundColor = "#27496D";
              document.body.style.backgroundColor = "#74A8D9";
              h1Element.style.color = "#27496D";
              prompt.style.color = "#27496D";
            } else if (mood === "angry") {
              const Prompts = [
                "Draw bold and dynamic lines to release your anger on the canvas.",
                "Create a visual representation of what calmness means to you.",
                "Illustrate a peaceful setting where conflicts are resolved peacefully.",
                "Use contrasting colors to convey the transformation from anger to serenity.",
                "Draw a series of abstract shapes that represent the process of letting go of anger.",
              ];
              const randomPrompt = Prompts[Math.floor(Math.random() * Prompts.length)];
              prompt.textContent = randomPrompt;
              document.getElementById("color1").style.backgroundColor = "#FF7676";
              document.getElementById("color2").style.backgroundColor = "#FF5C5C";
              document.getElementById("color3").style.backgroundColor = "#FF4242";
              document.getElementById("color4").style.backgroundColor = "#FF2828";
              document.getElementById("color5").style.backgroundColor = "#FF0E0E";
              document.body.style.backgroundColor = "#FF4D4D";
              h1Element.style.color = "#ffb0b0";
              prompt.style.color = "#ffb0b0";
            } else if (mood === "disgust") {
              const Prompts = [
                "Illustrate a scene of beauty that challenges your initial feeling of disgust.",
                "Create a visual representation of finding beauty in the mundane or overlooked.",
                "Draw a detailed close-up of an object or subject that initially disgusted you.",
                "Use vibrant colors to transform something typically associated with disgust into something intriguing.",
                "Sketch a person or character that embodies resilience and the ability to overcome negative emotions.",
              ];
              const randomPrompt = Prompts[Math.floor(Math.random() * Prompts.length)];
              prompt.textContent = randomPrompt;
              document.getElementById("color1").style.backgroundColor = "#B4D5AA";
              document.getElementById("color2").style.backgroundColor = "#9ACB90";
              document.getElementById("color3").style.backgroundColor = "#81C076";
              document.getElementById("color4").style.backgroundColor = "#67B65C";
              document.getElementById("color5").style.backgroundColor = "#4EA842";
              document.body.style.backgroundColor = "#94C98B";
              h1Element.style.color = "#4EA842";
              prompt.style.color = "#4EA842";
            } else if (mood === "fear") {
              const Prompts = [
                "Draw a safe and secure space that represents protection from your fears.",
                "Illustrate a courageous figure or superhero overcoming their fears.",
                "Create a visual representation of stepping out of your comfort zone.",
                "Draw a dream-like scene that transforms your fears into something beautiful.",
                "Sketch a symbol that represents strength and empowerment in the face of fear.",
              ];
              const randomPrompt = Prompts[Math.floor(Math.random() * Prompts.length)];
              prompt.textContent = randomPrompt;
              document.getElementById("color1").style.backgroundColor = "#B5C6E0";
              document.getElementById("color2").style.backgroundColor = "#9FB3D3";
              document.getElementById("color3").style.backgroundColor = "#8BA1C7";
              document.getElementById("color4").style.backgroundColor = "#7690BA";
              document.getElementById("color5").style.backgroundColor = "#617FAE";
              document.body.style.backgroundColor = "#95A8C5";
              h1Element.style.color = "#617FAE";
              prompt.style.color = "#617FAE";
            } else if (mood === "surprise") {
              const Prompts = [
                "Draw an unexpected twist to a familiar scene or object.",
                "Illustrate a magical or whimsical moment that captures the feeling of surprise.",
                "Create a visual representation of an unexpected connection between two unrelated elements.",
                "Draw a surreal composition that evokes a sense of awe and wonder.",
                "Sketch a series of surprising transformations or metamorphoses.",
              ];
              const randomPrompt = Prompts[Math.floor(Math.random() * Prompts.length)];
              prompt.textContent = randomPrompt;
              document.getElementById("color1").style.backgroundColor = "#FECB89";
              document.getElementById("color2").style.backgroundColor = "#FFBD75";
              document.getElementById("color3").style.backgroundColor = "#FFAF62";
              document.getElementById("color4").style.backgroundColor = "#FFA04F";
              document.getElementById("color5").style.backgroundColor = "#FF922C";
              document.body.style.backgroundColor = "#FFB677";
              h1Element.style.color = "#e07510";
              prompt.style.color = "#e07510";
            } else if (mood === "neutral") {
              const Prompts = [
                "Create a detailed still life drawing of everyday objects.",
                "Illustrate a scene of balance and harmony between different elements.",
                "Draw a calming and meditative pattern or mandala.",
                "Use shading and texture to convey a sense of tranquility and inner peace.",
                "Sketch a composition inspired by natural patterns and symmetry.",
              ];
              const randomPrompt = Prompts[Math.floor(Math.random() * Prompts.length)];
              prompt.textContent = randomPrompt;
              document.getElementById("color1").style.backgroundColor = "#D6D6D6";
              document.getElementById("color2").style.backgroundColor = "#BFBFBF";
              document.getElementById("color3").style.backgroundColor = "#A8A8A8";
              document.getElementById("color4").style.backgroundColor = "#919191";
              document.getElementById("color5").style.backgroundColor = "#7A7A7A";
              document.body.style.backgroundColor = "#B1B1B1";
              h1Element.style.color = "#7A7A7A";
              prompt.style.color = "#7A7A7A";
            }
            
            // Enable interaction with buttons after mood detection
            captureButton.disabled = false;
            retakeButton.disabled = false;
            detectButton.disabled = false;
            closeButton.disabled = false;
  
            // Change the text of the detect button back to "Detect Mood"
            detectButton.textContent = "Detect Mood";
  
            // Reset the UI state
            isCaptured = false;
            isDetecting = false;
          })
          .catch((error) => {
            console.error("Error during mood detection:", error);
            // Enable interaction with buttons in case of error
            captureButton.disabled = false;
            retakeButton.disabled = false;
            detectButton.disabled = false;
            closeButton.disabled = false;
  
            // Change the text of the detect button back to "Detect Mood"
            detectButton.textContent = "Detect Mood";
  
            // Reset the UI state
            isCaptured = false;
            isDetecting = false;
          });
      })
      .catch((error) => {
        console.error("Error fetching image data:", error);
        // Enable interaction with buttons in case of error
        captureButton.disabled = false;
        retakeButton.disabled = false;
        detectButton.disabled = false;
        closeButton.disabled = false;
  
        // Change the text of the detect button back to "Detect Mood"
        detectButton.textContent = "Detect Mood";
  
        // Reset the UI state
        isCaptured = false;
        isDetecting = false;
      });
  };
  

  // Function to retake the image
  const retakeImage = () => {
    if (isDetecting) {
      // If mood detection is in progress, do nothing
      return;
    }

    // Reset the UI state
    isCaptured = false;
    popupContent.innerHTML = "";
    startCamera();
  };

  // Function to close the popup
  const closePopup = () => {
    if (isDetecting) {
      // If mood detection is in progress, do nothing
      return;
    }
    isCaptured = false;
    isDetecting = false;

    popup.style.display = "none";
    stopCamera();
    retakeButton.removeEventListener("click", retakeImage);
  };

  // Event listener for the "Retake Image" button
  const retakeButton = document.querySelector("#retake-button");
  retakeButton.addEventListener("click", retakeImage);

  // Event listener for closing the popup
  const closeButton = document.querySelector(".close-button");
  closeButton.addEventListener("click", closePopup);

  // Event listener for capturing an image
  const captureButton = document.querySelector("#capture-button");
  captureButton.addEventListener("click", () => {
    if (isDetecting) {
      // If mood detection is in progress, do nothing
      return;
    }

    if (isCaptured) {
      // If an image is already captured, do nothing
      return;
    }

    captureImage();
  });

  // Event listener for detecting mood
  const detectButton = document.querySelector("#detect-button");
  detectButton.addEventListener("click", () => {
    if (!isCaptured || isDetecting) {
      // If no image is captured or mood detection is in progress, do nothing
      return;
    }
    
    isDetecting = true; // Set the mood detection flag

    detectMood();
  });

  // Open the popup
  popup.style.display = "flex";
  startCamera();
});



closeButton.addEventListener("click", () => {
  popup.style.display = "none";
});
