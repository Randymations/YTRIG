const densities = {
  "mipmap-mdpi": 269, "mipmap-hdpi": 403,
  "mipmap-xhdpi": 538, "mipmap-xxhdpi": 806,
  "mipmap-xxxhdpi": 1075,
};
document.getElementById("generateBtn").addEventListener("click", async () => {
  const fg = document.getElementById("foregroundInput").files[0];
  const bg = document.getElementById("backgroundInput").files[0];
  const status = document.getElementById("status");
  if (!fg || !bg) return alert("Select both PNG images.");
  status.textContent = "Loading…";
  const [fgImg, bgImg] = await Promise.all([loadImage(fg), loadImage(bg)]);
  if (fgImg.width !== bgImg.width || fgImg.width !== fgImg.height)
    return alert("Images must be square and same size.");
  const zip = new JSZip();
  for (const [name, size] of Object.entries(densities)) {
    const folder = zip.folder(name);
    const rfg = resize(fgImg, size);
    const rbg = resize(bgImg, size);
    const comb = overlay(rbg, rfg);
    folder.file("adaptiveproduct_youtube_foreground_color_108.png", toBlob(rfg));
    folder.file("adaptiveproduct_youtube_background_color_108.png", toBlob(rbg));
    folder.file("ic_launcher.png", toBlob(comb));
    folder.file("ic_launcher_round.png", toBlob(comb));
  }
  status.textContent = "Creating ZIP…";
  const blob = await zip.generateAsync({ type: "blob" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mipmap_output.zip";
  link.click();
  status.textContent = "Done! Download should start.";
});
function loadImage(f) {
  return new Promise(r => {
    const img = new Image();
    img.onload = () => r(img);
    img.src = URL.createObjectURL(f);
  });
}
function resize(img, s) {
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, s, s);
  return c;
}
function overlay(bgC, fgC) {
  const c = document.createElement("canvas");
  c.width = bgC.width; c.height = bgC.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(bgC, 0, 0);
  ctx.drawImage(fgC, 0, 0);
  return c;
}
function toBlob(c) {
  const d = c.toDataURL("image/png");
  const u = atob(d.split(",")[1]);
  const b = new Uint8Array(u.length);
  for (let i = 0; i < u.length; ++i) b[i] = u.charCodeAt(i);
  return new Blob([b], { type: "image/png" });
}
