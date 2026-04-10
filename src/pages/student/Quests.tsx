import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords } from "lucide-react";

export default function StudentQuests() {
  return (
    <div className="space-y-4">
      <h2 className="font-pixel text-[10px] text-foreground flex items-center gap-2">
        <Swords className="h-4 w-4" /> QUESTS
      </h2>

      <Card className="border-2 border-dashed border-border">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground text-sm">
            Quests will appear here once you start submitting work. The AI agent will generate personalized challenges based on your performance!
          </p>
          <p className="font-pixel text-[8px] text-accent mt-2">🔮 COMING WITH AI INTEGRATION (PHASE 4)</p>
        </CardContent>
      </Card>
    </div>
  );
}
