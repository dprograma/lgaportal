"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 774, suffix: "", label: "LGAs Registered" },
  { value: 36, suffix: "", label: "States Covered" },
  { value: 1, suffix: "M+", label: "Citizens Engaged" },
  { value: 98, suffix: "%", label: "Transparency Score" },
];

function CountUp({
  end,
  suffix,
  started,
}: {
  end: number;
  suffix: string;
  started: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(eased * end));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started, end]);

  return (
    <span>
      {current}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-16 lg:py-20 gradient-primary" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-white/80 text-sm font-semibold uppercase tracking-widest mb-12"
        >
          Trusted by Citizens Across Nigeria
        </motion.p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/20">
          {stats.map(({ value, suffix, label }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex flex-col items-center gap-2 px-6 py-8"
            >
              <span className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                <CountUp end={value} suffix={suffix} started={inView} />
              </span>
              <span className="text-white/70 text-sm font-medium text-center">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
