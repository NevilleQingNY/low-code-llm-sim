import React from 'react';
import { useDnD } from './DnDContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModeToggle } from "@/components/ModeToggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface NodeType {
  customInput: string;
  customCommon: string;
  customOutput: string;
}

const NODE_TYPES = {
  customInput: { name: 'Input Node', icon: ArrowDownToLine },
  customCommon: { name: 'Default Node', icon: ArrowRightLeft },
  customOutput: { name: 'Output Node', icon: ArrowUpFromLine },
};

export function Sidebar() {
  const [_, setType] = useDnD();

  const onDragStart = (event: React.DragEvent<HTMLButtonElement>, nodeType: keyof typeof NODE_TYPES) => {
    event.dataTransfer.effectAllowed = 'move';
    setType(nodeType);
  };

  return (
    <Card className="w-16 h-full border-r bg-background">
      <CardContent className="p-2">
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center space-y-4">
            {(Object.keys(NODE_TYPES) as Array<keyof typeof NODE_TYPES>).map((type) => (
              <TooltipProvider key={type}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-12 h-12 rounded-full cursor-move hover:bg-muted"
                      onDragStart={(event) => onDragStart(event, type)}
                      draggable
                    >
                      {React.createElement(NODE_TYPES[type].icon, { className: "w-6 h-6 text-foreground" })}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{NODE_TYPES[type].name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <ModeToggle />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default Sidebar;
