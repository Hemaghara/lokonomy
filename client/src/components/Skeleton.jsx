import React from "react";

const Skeleton = ({ className = "" }) => {
  return <div className={`skeleton ${className}`} />;
};

export const CardSkeleton = () => (
  <div className="card space-y-4">
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex justify-between items-center pt-4">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </div>
);

export const ProductSkeleton = () => (
  <div className="bg-[#0d1120] border border-white/[0.07] rounded-[20px] overflow-hidden p-6 space-y-4">
    <Skeleton className="h-40 w-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
    <div className="flex justify-between items-center pt-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const MarketSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {[...Array(8)].map((_, i) => (
      <ProductSkeleton key={i} />
    ))}
  </div>
);

export const BusinessDetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
    <div className="relative h-96 w-full rounded-3xl overflow-hidden skeleton" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    </div>
  </div>
);

export default Skeleton;
