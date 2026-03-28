import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { jargonDefinitions } from "@/lib/mock-data";
import { useApp } from "@/context/AppContext";

interface JargonTermProps {
  term: string;
  children?: React.ReactNode;
}

export const JargonTerm = ({ term, children }: JargonTermProps) => {
  const { beginnerMode } = useApp();
  const definition = jargonDefinitions[term];

  if (!definition || !beginnerMode) return <>{children || term}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-0.5 cursor-help border-b border-dashed border-muted-foreground/40">
          {children || term}
          <HelpCircle className="h-3 w-3 text-muted-foreground" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs glass-card text-sm" side="top">
        <p className="font-semibold text-primary mb-1">{term}</p>
        <p className="text-muted-foreground">{definition}</p>
      </TooltipContent>
    </Tooltip>
  );
};
