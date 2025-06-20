import { Bot, Play } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { isChallengeCompleted } from "../queries"

export default async function BoxobanHeader() {
  const challengeCompleted = await isChallengeCompleted()

  return (
    <div className="text-center space-y-6">
      <div className="flex items-center justify-center gap-3">
        <h1 className="text-4xl font-pixel text-primary">Boxoban Challenge</h1>
      </div>

      <div className="font-mono text-muted-foreground text-lg">
        <span className="text-muted-foreground mr-2">&gt;</span>
        Globally synchronized competitive puzzle solving_
      </div>

      <Button
        asChild
        size="lg"
        disabled={challengeCompleted}
        className="font-pixel pixelated-border"
      >
        <Link href="/boxoban/play">
          <Play className="mr-2 w-4 h-4" />
          {!challengeCompleted ? "Continue Challenge" : "Challenge Completed"}
        </Link>
      </Button>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem
            value="challenge-details"
            className="border-primary/20"
          >
            <AccordionTrigger className="font-pixel text-primary hover:text-primary/80">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Challenge Details
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <p className="font-mono text-foreground/80 text-left">
                Powered by{" "}
                <span className="text-primary font-semibold">
                  DeepMind&apos;s Boxoban dataset
                </span>
                , featuring over{" "}
                <span className="text-primary font-semibold">1.5 million</span>{" "}
                procedurally generated levels. Each level is uniquely assigned
                to one player, and once solved, it&apos;s permanently completed
                for everyone.
              </p>

              <div className="bg-primary/5 p-4 rounded border border-primary/20">
                <div className="font-mono [&>*]:text-lg space-y-3">
                  <div className="text-primary font-semibold text-center">
                    AI-Categorized Difficulty System
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="text-center">
                      <div className="text-green-400 font-semibold">
                        Unfiltered
                      </div>
                      <div className="text-green-300">1,001,000 levels</div>
                      <div className="text-foreground/70">
                        Raw generator output
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 font-semibold">
                        Medium
                      </div>
                      <div className="text-yellow-300">500,000 levels</div>
                      <div className="text-foreground/70">
                        Non-trivial reasoning
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-400 font-semibold">Hard</div>
                      <div className="text-red-300">3,332 levels</div>
                      <div className="text-foreground/70">
                        Stumped AI agents
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
