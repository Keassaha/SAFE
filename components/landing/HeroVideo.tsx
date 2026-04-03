"use client";

import { useEffect, useRef } from "react";

/** HLS (.m3u8) ou MP4 — même origine ou CORS ouvert pour HLS.js */
const VIDEO_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_URL?.trim() ?? "";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !VIDEO_URL) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    let cancelled = false;

    const cleanupHls = () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };

    const url = VIDEO_URL;

    if (url.endsWith(".m3u8")) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.loop = true;
        void video.play().catch(() => {});
        return () => {
          video.removeAttribute("src");
          video.load();
        };
      }

      void import("hls.js").then(({ default: Hls }) => {
        if (cancelled || !video) return;
        if (!Hls.isSupported()) return;
        cleanupHls();
        const hls = new Hls({
          maxBufferLength: 24,
          maxMaxBufferLength: 48,
          enableWorker: true,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.loop = true;
          void video.play().catch(() => {});
        });
      });

      return () => {
        cancelled = true;
        cleanupHls();
        video.removeAttribute("src");
        video.load();
      };
    }

    video.src = url;
    video.loop = true;
    void video.play().catch(() => {});
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, []);

  if (!VIDEO_URL) return null;

  return (
    <video
      ref={videoRef}
      className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover opacity-[0.35] contrast-[1.05] saturate-[0.85]"
      aria-hidden
      autoPlay
      muted
      playsInline
      loop
    />
  );
}
