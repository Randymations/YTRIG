const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const generateBtn = document.getElementById("generateBtn");
const status = document.getElementById("status");

let imageFiles = [];

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  const pngs = [...files].filter(file => file.type === "image/png");
  if (pngs.length !== 2) {
    alert("Please select exactly two PNG images.");
    return;
  }
  imageFiles = pngs;
  status.textContent = `Loaded: ${pngs[0].name}, ${pngs[1].name}`;
}

generateBtn.addEventListener("click", async () => {
  if (imageFiles.length !== 2) {
    alert("You must select or drop exactly two PNG images.");
    return;
  }

  const [fgFile, bgFile] = imageFiles;

  status.textContent = "Loading images...";
  const [fgImg, bgImg] = await Promise.all([loadImage(fgFile), loadImage(bgFile)]);

  if (fgImg.width !== fgImg.height || bgImg.width !== bgImg.height || fgImg.width !== bgImg.width) {
    alert("Both images must be square and of the same size.");
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

  status.textContent = "Generating ZIP...";
  const blob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ytrig_output.zip";
  link.click();
  status.textContent = "Done! ZIP downloaded.";
});

// Utility Functions

function loadImage(file) {
  return new Promise((resolve) => {
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
