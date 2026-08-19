import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/layout/StatusBadge";
import type { CaseListItem } from "@/lib/db/queries/cases";

export function CaseCard({ caseItem }: { caseItem: CaseListItem }) {
  return (
    <Link href={`/cases/${caseItem.slug}`}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{caseItem.title}</CardTitle>
            <StatusBadge status={caseItem.status} />
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">{caseItem.category}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
