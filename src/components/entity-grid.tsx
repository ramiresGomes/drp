import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EntityGrid({
  items,
}: {
  items: { name: string; note: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.name} className="shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{item.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
