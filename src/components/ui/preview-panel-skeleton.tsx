import { Skeleton } from "./skeleton";

export function PreviewPanelSkeleton() {
  return (
    <div className="ui-surface flex h-full flex-col gap-5 px-5 py-5 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid gap-3 border-border border-y py-4 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="space-y-2" key={index}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
