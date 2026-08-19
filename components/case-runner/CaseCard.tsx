import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/layout/StatusBadge";
import type { CaseListItem } from "@/lib/db/queries/cases";

export function CaseCard({ caseItem }: { caseItem: CaseListItem }) {
  return (
    <Link href={`/cases/${caseItem.slug}`}>
      <Card className="h-full transition-colors hover:ring-primary/40">
        <CardHeader>
          <CardTitle className="text-base leading-snug text-balance">{caseItem.title}</CardTitle>
        </CardHeader>
        {/* Badges sit below the title rather than beside it: side-by-side, a long
            title and a long status label ("Em validação") squeeze each other and
            both end up clipped. */}
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{caseItem.category}</Badge>
          <StatusBadge status={caseItem.status} />
        </CardContent>
      </Card>
    </Link>
  );
}
