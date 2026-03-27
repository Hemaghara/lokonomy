export const getMediaUrl = (mediaId, type = "real") => {
  if (!mediaId) return "";

  // Backwards compatibility for old records that straight up saved Cloudinary URLs
  if (mediaId.startsWith("http")) {
    if (mediaId.includes("res.cloudinary.com") && type === "thumb") {
       // Auto-generate Cloudinary Native Thumbnails for old Full Images!
       // Transforms https://res.cloudinary.com/xyz/image/upload/v123/fol/img.jpg
       // Into https://res.cloudinary.com/xyz/image/upload/c_fill,w_300/v123/fol/img.jpg
       return mediaId.replace('/upload/', '/upload/c_fill,w_300,q_auto,f_webp/');
    }
    // Also upgrade full images to webp format on the fly if requested
    if (mediaId.includes("res.cloudinary.com") && type === "real") {
       return mediaId.replace('/upload/', '/upload/q_auto,f_webp/');
    }
    return mediaId;
  }

  // Uses Vite Environment variables explicitly for swapping domains without touching code
  const provider = import.meta.env.VITE_STORAGE_PROVIDER || "CLOUDINARY";
  const domain = import.meta.env.VITE_CLOUD_DOMAIN;

  if (provider === "S3") {
    return `${domain}/${mediaId}-${type}.${type === "thumb" ? "webp" : "webp"}`;
  }

  // Cloudinary fallback pattern if domain is provided or assume generic
  if (provider === "CLOUDINARY") {
    if (domain) return `${domain}/image/upload/${mediaId}-${type}.${type === "thumb" ? "webp" : "webp"}`;
    return `https://res.cloudinary.com/demo/image/upload/${mediaId}-${type}.${type === "thumb" ? "webp" : "webp"}`;
  }

  return "";
};
