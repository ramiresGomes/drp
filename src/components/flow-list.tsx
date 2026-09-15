import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FlowList({
  flows,
}: {
  flows: { id: string; title: string; steps: string[] }[];
}) {
  return (
    <Accordion multiple defaultValue={flows.map((flow) => flow.id)} className="w-full">
      {flows.map((flow) => (
        <AccordionItem key={flow.id} value={flow.id}>
          <AccordionTrigger className="text-left text-lg">{flow.title}</AccordionTrigger>
          <AccordionContent>
            <ol className="space-y-3 pl-1">
              {flow.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
