import jsPDF from "jspdf";

export async function downloadCertificateAsPdf(svgText: string, filename: string) {
  // Create an image from the SVG
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Falha ao carregar SVG"));
    img.src = url;
  });

  const canvas = document.createElement("canvas");
  const scale = 2; // Higher resolution
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [img.width, img.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, img.width, img.height);
  pdf.save(filename);
}
