import React from "react";
import { getMediaUrl } from "../utils/mediaUrl";

const MediaImage = ({ mediaId, type = "thumb", alt = "Media", className = "", ...props }) => {
  const src = getMediaUrl(mediaId, type);

  return (
    <img 
      src={src} 
      alt={alt} 
      className={`object-cover ${className}`} 
      loading="lazy" 
      onError={(e) => { e.target.src = "/placeholders/missing.png"; }}
      {...props}
    />
  );
};

export default MediaImage;
