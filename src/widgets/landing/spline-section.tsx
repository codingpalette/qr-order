"use client";

import Spline from "@splinetool/react-spline";

export function SplineSection() {
  return (
    <section className="relative w-full py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="aspect-video w-full overflow-hidden rounded-2xl">
          <Spline scene="https://prod.spline.design/0jvIgHNgJJNCxJDA/scene.splinecode" />
        </div>
      </div>
    </section>
  );
}
