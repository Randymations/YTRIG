const fgInput = document.getElementById("foregroundInput");
const bgInput = document.getElementById("backgroundInput");
const fgZone = document.getElementById("foregroundZone");
const bgZone = document.getElementById("backgroundZone");
const statusText = document.getElementById("status");
const generateBtn = document.getElementById("generateBtn");

let fgFile = null;
let bgFile = null;

// Shared dropzone behavior
function setupDropzone(zone, input, assignFile) {
  zone.addEventListener("dragover", e => {
    e.preventDefault();
    zone.classList.add("dragover");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("dragover");
  });

  zone.addEventListener("drop", e => {
    e.preventDefault();
    zone.classList.remove("dragover");
    const file = [...e.dataTransfer.files].find(f => f.type === "image/png");
    if (file) {
      assignFile(file);
    } else {
      alert("Only PNG files are supported.");
    }
  });

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (file && file.type === "image/png") {
      assignFile(file);
    } else {
      alert("Only PNG files are supported.");
    }
  });
}

// File assignment
setupDropzone(fgZone, fgInput, file => {
  fgFile = file;
  statusText.textContent = `Foreground loaded: ${file.name}`;
});

setupDropzone(bgZone, bgInput, file => {
  bgFile = file;
  statusText.textContent = `Background loaded: ${file.name}`;
});

// Main generation
generateBtn.addEventListener("click", async () => {
  if (!fgFile || !bgFile) {
    alert("Both foreground and background PNGs must be provided.");
    return;
  }

  statusText.textContent = "Loading images...";
  const [fgImg, bgImg] = await Promise.all([loadImage(fgFile), loadImage(bgFile)]);

  if (fgImg.width !== fgImg.height || bgImg.width !== bgImg.height || fgImg.width !== bgImg.width) {
    alert("Both images must be square and the same resolution.");
    return;
  }

  const zip = new JSZip();
  const densities = {
    "mipmap-mdpi": 269,
    "mipmap-hdpi": 403,
    "mipmap-xhdpi": 538,
    "mipmap-xxhdpi": 806,
    "mipmap-xxxhdpi": 1075,
  };

  for (const [folderName, size] of Object.entries(densities)) {
    const folder = zip.folder(folderName);
    const resizedFG = resizeImage(fgImg, size);
    const resizedBG = resizeImage(bgImg, size);
    const combined = overlayImages(resizedBG, resizedFG);

    folder.file("adaptiveproduct_youtube_foreground_color_108.png", canvasToBlob(resizedFG));
    folder.file("adaptiveproduct_youtube_background_color_108.png", canvasToBlob(resizedBG));
    folder.file("ic_launcher.png", canvasToBlob(combined));
    folder.file("ic_launcher_round.png", canvasToBlob(combined));
  }

  statusText.textContent = "Generating ZIP...";
  const blob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ytrig_output.zip";
  link.click();
  statusText.textContent = "Download complete.";
});

// Helpers
function loadImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = URL.createObjectURL(file);
  });
}

function resizeImage(image, size) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, size, size);
  return canvas;
}

function overlayImages(bgCanvas, fgCanvas) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = bgCanvas.width;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bgCanvas, 0, 0);
  ctx.drawImage(fgCanvas, 0, 0);
  return canvas;
}

function canvasToBlob(canvas) {
  const dataURL = canvas.toDataURL("image/png");
  const binary = atob(dataURL.split(",")[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "image/png" });
}
