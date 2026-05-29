"use client";

import React from "react";

export function HomeSkeleton() {
  return (
    <div className="flex-1 w-full bg-white flex flex-col min-h-screen animate-pulse">
      {/* 2. Welcome Panel matching mockup */}
      <div className="px-4 pt-7 pb-4 w-full">
        <div className="h-6 w-36 bg-slate-200 rounded-md mb-2"></div>
        <div className="h-3 w-56 bg-slate-200 rounded-md"></div>
      </div>

      {/* 3. Rounded-t Badge Tab Block */}
      <div className="px-4 mt-4 w-full">
        <div className="w-36 h-9 bg-slate-200 rounded-t-lg"></div>
      </div>

      {/* 4. Community Card Lists */}
      <div className="flex-1 px-4 w-full pb-24">
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-slate-100 rounded-xl p-3.5 border border-slate-200/50"
            >
              {/* Initials Avatar Square */}
              <div className="w-11 h-11 rounded-lg bg-slate-200 shrink-0"></div>

              {/* Title & Member Count */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="h-3 w-32 bg-slate-200 rounded-md"></div>
                <div className="h-2 w-20 bg-slate-200 rounded-md"></div>
              </div>

              {/* Role pill badge */}
              <div className="h-5 w-16 bg-slate-200 rounded-full shrink-0"></div>
            </div>
          ))}
        </div>

        {/* Explore Pill Button */}
        <div className="mt-6">
          <div className="w-full h-11 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex-1 w-full bg-[#FDFBF7] flex flex-col min-h-screen relative font-sans animate-pulse">
      {/* Navy Header Block */}
      <div className="relative bg-[#0B1E36] pt-12 pb-8 px-6 text-center shrink-0 shadow-md flex flex-col items-center">
        {/* Edit Pill Button */}
        <div className="absolute top-4 right-4 w-12 h-6 bg-slate-700/50 rounded-full"></div>

        {/* Large Avatar Circle */}
        <div className="w-24 h-24 bg-slate-700/50 rounded-full mb-3 border-4 border-[#0B1E36]"></div>

        {/* User Name & Email */}
        <div className="h-5 w-40 bg-slate-700/50 rounded-md mb-2"></div>
        <div className="h-3 w-48 bg-slate-700/50 rounded-md mb-4"></div>

        {/* Stat Row */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-white/10 w-full">
          <div className="flex flex-col items-center gap-1.5 w-16">
            <div className="h-4 w-6 bg-slate-700/50 rounded"></div>
            <div className="h-2.5 w-12 bg-slate-700/50 rounded"></div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="flex flex-col items-center gap-1.5 w-16">
            <div className="h-4 w-6 bg-slate-700/50 rounded"></div>
            <div className="h-2.5 w-12 bg-slate-700/50 rounded"></div>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="flex flex-col items-center gap-1.5 w-16">
            <div className="h-4 w-6 bg-slate-700/50 rounded"></div>
            <div className="h-2.5 w-12 bg-slate-700/50 rounded"></div>
          </div>
        </div>
      </div>

      {/* Surface Grey Card Area */}
      <div className="flex-1 bg-[#E2E5E9]/75 border-t border-slate-200/50 rounded-t-3xl -mt-4 px-5 py-6 flex flex-col gap-5">
        {/* NIM Field */}
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-10 bg-slate-300 rounded"></div>
          <div className="w-full h-10 bg-white border border-slate-200 rounded-xl"></div>
        </div>

        {/* Fakultas Field */}
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-16 bg-slate-300 rounded"></div>
          <div className="w-full h-10 bg-white border border-slate-200 rounded-xl"></div>
        </div>

        {/* Minat Tags */}
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-12 bg-slate-300 rounded"></div>
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-white border border-slate-200 rounded-full"></div>
            <div className="h-7 w-24 bg-white border border-slate-200 rounded-full"></div>
            <div className="h-7 w-16 bg-white border border-slate-200 rounded-full"></div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pb-24 shrink-0">
          <div className="w-full h-12 bg-[#EF4444]/25 rounded-xl border border-red-200"></div>
        </div>
      </div>
    </div>
  );
}
