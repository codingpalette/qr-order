"use client";

import { useState, useEffect, useCallback } from "react";
import { useActiveEventBanners } from "@/entities/promotion/api/useActiveEventBanners";
import type { EventBanner } from "@/entities/promotion/model/types";

interface EventBannerCarouselProps {
  storeId: string;
}

export function EventBannerCarousel({ storeId }: EventBannerCarouselProps) {
  const { data: banners = [] } = useActiveEventBanners(storeId);
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, 4500);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  if (banners.length === 0) return null;

  const handleBannerTap = (banner: EventBanner) => {
    if (!banner.link_type || !banner.link_value) return;

    switch (banner.link_type) {
      case "menu":
        // Scroll to menu item (best-effort)
        document.getElementById(`menu-${banner.link_value}`)?.scrollIntoView({ behavior: "smooth" });
        break;
      case "coupon":
        // Copy coupon code to clipboard
        navigator.clipboard?.writeText(banner.link_value).catch(() => {});
        break;
      case "external":
        window.open(banner.link_value, "_blank", "noopener");
        break;
    }
  };

  return (
    <div className="px-4 pt-3">
      <div className="relative overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="w-full shrink-0 cursor-pointer"
              onClick={() => handleBannerTap(banner)}
            >
              {banner.image_url ? (
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="aspect-[2.5/1] md:aspect-[3.5/1] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[2.5/1] md:aspect-[3.5/1] w-full items-center justify-center bg-gradient-to-r from-orange-400 to-orange-500 px-6">
                  <div className="text-center text-white">
                    <p className="text-base font-bold">{banner.title}</p>
                    {banner.description && (
                      <p className="mt-1 text-xs opacity-90">{banner.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                className={`size-1.5 rounded-full transition-colors ${
                  idx === currentIndex ? "bg-white" : "bg-white/50"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
