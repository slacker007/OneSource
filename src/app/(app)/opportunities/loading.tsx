import { PreviewPanelSkeleton } from "@/components/ui/preview-panel-skeleton";
import { SavedViewControls } from "@/components/ui/saved-view-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

export default function OpportunitiesLoading() {
  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-4 w-3/4 max-w-2xl" />
        </div>
      </header>

      <section className="border-border bg-surface rounded-[32px] border px-6 py-6 shadow-[0_20px_60px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <SavedViewControls
              items={[
                { href: "/opportunities", label: "All pursuits" },
                { href: "/opportunities", label: "Due soon" },
                { href: "/opportunities", label: "Qualified" },
              ]}
              label="Standard views"
            />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-10 w-52" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="space-y-2" key={index}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <TableSkeleton />
        <PreviewPanelSkeleton />
      </div>
    </section>
  );
}
