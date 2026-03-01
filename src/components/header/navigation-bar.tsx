"use client";
import { useState, useEffect, useRef } from "react";
import TopInfoBar from "./top-info-bar";
import LogoAndSearchBar from "./logo-and-search-bar";
import DesktopNavMenu from "./desktop-nav-menu";
import MobileMenu from "./mobile-menu";

interface NavbarItem {
  _id: string;
  label: string;
  slug: string;
  level: 1 | 2 | 3;
  type: "category" | "brand" | "subCategory" | "subBrand";
  children?: NavbarItem[];
}

interface NavigationBarProps {
  menuData: NavbarItem[];
}

export default function NavigationBar({ menuData }: NavigationBarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const isCompactRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);
  const ignoringRef = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      // Ignore scroll events that fire immediately after we change state
      // (caused by the sticky header resizing and shifting the page)
      if (ignoringRef.current) return;

      const y = window.scrollY;
      const headerH = headerRef.current?.offsetHeight ?? 100;

      // Hide: scrolled past 2× the full header height
      // Show: scrolled back above 10px
      // The large gap prevents the resize-induced scroll from crossing both thresholds
      if (!isCompactRef.current && y > headerH * 2) {
        ignoringRef.current = true;
        isCompactRef.current = true;
        setIsCompact(true);
        setTimeout(() => {
          ignoringRef.current = false;
        }, 400);
      } else if (isCompactRef.current && y < 10) {
        ignoringRef.current = true;
        isCompactRef.current = false;
        setIsCompact(false);
        setTimeout(() => {
          ignoringRef.current = false;
        }, 400);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Filter only level 1 items (top-level navigation)
  const topLevelItems = menuData.filter((item) => item.level === 1);

  return (
    <header
      ref={headerRef}
      className="w-full bg-muted sticky top-0 z-50 shadow-sm"
    >
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCompact ? "max-h-0 opacity-0" : "max-h-40 opacity-100"
        }`}
      >
        <TopInfoBar />
      </div>
      <LogoAndSearchBar onMobileMenuOpen={() => setIsMobileMenuOpen(true)} />

      <DesktopNavMenu
        topLevelItems={topLevelItems}
        className={`transition-all duration-300 ease-in-out ${
          isCompact ? "max-h-0 opacity-0" : "opacity-100"
        }`}
      />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        topLevelItems={topLevelItems}
      />
    </header>
  );
}
