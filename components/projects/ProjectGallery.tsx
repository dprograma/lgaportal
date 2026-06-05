"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";

interface Props {
  images: string[];
  videoUrl?: string;
}

function getVideoEmbed(url: string): string | null {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null; // mp4 or other — render as <video>
}

export default function ProjectGallery({ images, videoUrl }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const hasImages = images.length > 0;
  const embedUrl = videoUrl ? getVideoEmbed(videoUrl) : null;
  const isDirectVideo =
    videoUrl && !embedUrl && (videoUrl.endsWith(".mp4") || videoUrl.includes(".mp4"));

  function prevImage() {
    setActiveIdx((i) => (i - 1 + images.length) % images.length);
  }

  function nextImage() {
    setActiveIdx((i) => (i + 1) % images.length);
  }

  if (!hasImages && !videoUrl) return null;

  return (
    <>
      <div className="space-y-3">
        {/* Hero image */}
        {hasImages && (
          <div
            className="relative rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in group"
            onClick={() => setLightbox(true)}
          >
            <img
              src={images[activeIdx]}
              alt={`Project image ${activeIdx + 1}`}
              className="w-full h-72 sm:h-96 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {activeIdx + 1} / {images.length}
            </div>
          </div>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  activeIdx === i ? "border-green-500" : "border-transparent hover:border-slate-300"
                }`}
              >
                <img
                  src={src}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-16 w-20 object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Video embed */}
        {videoUrl && (
          <div className="rounded-2xl overflow-hidden bg-slate-900">
            {embedUrl ? (
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  src={embedUrl}
                  title="Project video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            ) : isDirectVideo ? (
              <video
                src={videoUrl}
                controls
                className="w-full max-h-96 rounded-2xl"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-24 text-slate-400 gap-2">
                <Play className="h-5 w-5" />
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  Watch video
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && hasImages && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          <img
            src={images[activeIdx]}
            alt={`Project image ${activeIdx + 1}`}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`h-2 w-2 rounded-full transition-all ${
                  activeIdx === i ? "bg-white w-4" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
