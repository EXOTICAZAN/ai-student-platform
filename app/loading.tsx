import { LoadingPanel } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-20 lg:px-8">
      <div className="w-full">
        <LoadingPanel label="Loading…" />
      </div>
    </div>
  );
}
