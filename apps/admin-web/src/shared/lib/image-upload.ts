const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 1800;
const OUTPUT_QUALITY = 0.86;
const OUTPUT_TYPE = "image/webp";

export const imageUploadAccept = Array.from(ACCEPTED_IMAGE_TYPES).join(",");

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể đọc file ảnh này."));
    image.src = src;
  });

export const optimizeImageFile = async (file: File): Promise<string> => {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ảnh tải lên tối đa 8MB.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_DIMENSION / image.naturalWidth, MAX_DIMENSION / image.naturalHeight);
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL(OUTPUT_TYPE, OUTPUT_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

