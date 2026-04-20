"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, useMotionValue, useTransform } from "framer-motion";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const progress = useMotionValue(0);
  const isVisible = useMotionValue(0);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    clearTimers();

    // Reset and start progress animation
    progress.set(0);
    isVisible.set(1);

    timersRef.current.push(setTimeout(() => progress.set(30), 50));
    timersRef.current.push(setTimeout(() => progress.set(60), 150));
    timersRef.current.push(setTimeout(() => progress.set(90), 300));
    timersRef.current.push(setTimeout(() => {
      progress.set(100);
      timersRef.current.push(setTimeout(() => isVisible.set(0), 200));
    }, 400));

    return clearTimers;
  }, [pathname, searchParams, progress, isVisible, clearTimers]);

  const scaleX = useTransform(progress, [0, 100], [0, 1]);
  const opacity = useTransform(isVisible, [0, 1], [0, 1]);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 z-[9999] bg-gradient-to-r from-iris via-iris-light to-iris origin-left"
      style={{ scaleX, opacity }}
    />
  );
}
