import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends React.ComponentProps<typeof Button> {
  onClick: (e: React.MouseEvent) => void;
}

export function EditButton({ className, ...props }: ActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 text-muted-foreground hover:text-primary", className)}
      {...props}
    >
      <Pencil className="w-4 h-4" />
      <span className="sr-only">Edit</span>
    </Button>
  );
}

export function DeleteButton({ className, ...props }: ActionButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 text-muted-foreground hover:text-destructive", className)}
      {...props}
    >
      <Trash2 className="w-4 h-4" />
      <span className="sr-only">Delete</span>
    </Button>
  );
}
