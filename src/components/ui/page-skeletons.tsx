import { Skeleton } from "./skeleton";
import { Card, CardBody } from "./card";

export function TablePageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <Card>
        <CardBody>
          <Skeleton className="h-10 w-64 rounded-lg mb-5" />
          <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-40 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="h-3 w-16 mb-3" />
              <Skeleton className="h-7 w-10" />
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Card>
        <CardBody className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
