"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import SearchForm from "./SearchForm";

export default function SiteNav({ categories = [], user = null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href) => pathname === href;

  function closeOnNavigation(event) {
    if (event.target.closest("a")) setOpen(false);
  }

  return (
    <>
      <nav aria-label="Sections" className="sticky top-0 z-40 border-y border-line-dark bg-surface/95 backdrop-blur">
        <div className="wrap flex items-center justify-between gap-6">
          <div className="hidden min-w-0 flex-1 items-center gap-5 lg:flex xl:gap-7">
            {categories.map((category) => (
              <Link
                key={category._id}
                href={`/category/${category.slug}`}
                aria-current={isActive(`/category/${category.slug}`) ? "page" : undefined}
                className="nav-link"
              >
                {category.name}
              </Link>
            ))}
          </div>

          <div className="flex h-12 w-full items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              <Icon name="menu" size={18} />
              Sections
            </button>
            <div className="flex items-center gap-5">
              <Link href="/urdu" className="font-urdu text-sm leading-none">
                اردو
              </Link>
              <Link href="/search" aria-label="Search" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
                <Icon name="search" size={15} /> Search
              </Link>
            </div>
          </div>

          <div className="hidden items-center gap-5 lg:flex">
            <Link href="/urdu" className="flex items-center gap-1.5 border-l border-line-dark pl-5 font-urdu text-sm leading-none transition-colors hover:text-gold">
              اردو
            </Link>
            <Link href="/search" className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:text-gold">
              <Icon name="search" size={14} /> Search
            </Link>
          </div>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" id="mobile-nav" aria-label="Site menu">
          <button
            type="button"
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div
            onClick={closeOnNavigation}
            className="absolute inset-y-0 left-0 flex w-[min(88vw,380px)] flex-col overflow-y-auto bg-ink shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line-dark px-5 py-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ivory/55">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center border border-line-dark"
                aria-label="Close menu"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="border-b border-line-dark p-5">
              <SearchForm id="search-mobile" />
            </div>

            <div className="px-5 py-5">
              <p className="kicker mb-3">Sections</p>
              <div className="grid grid-cols-2 gap-x-4">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    href={`/category/${category.slug}`}
                    className="border-b border-line-dark/70 py-2.5 font-display text-lg"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <p className="kicker mb-3">MIC TECH</p>
              <div className="flex flex-col gap-3 text-sm">
                <Link href="/urdu" className="font-urdu text-lg">اردو ڈیسک</Link>
                <Link href="/about">About MIC TECH</Link>
                <Link href="/editorial-policy">Editorial standards</Link>
                <Link href="/contact">Contact the newsroom</Link>
                <Link href="/#newsletter">Newsletter</Link>
              </div>
            </div>

            <div className="mt-auto border-t border-line-dark p-5">
              {user ? (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-ivory/55">Signed in as {user.name}</p>
                  <Link href={user.role === "admin" ? "/admin" : "/account"} className="btn-dark w-full">
                    {user.role === "admin" ? "Admin dashboard" : "My account"}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" className="btn-outline">Sign in</Link>
                  <Link href="/signup" className="btn-gold">Join</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
