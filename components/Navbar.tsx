"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import ThemeSwitcher from "@/components/ThemeSwitcher"
import AuthDialog from "@/components/AuthDialog"
import { User, Infinity, Trophy, Pencil, Gamepad2 } from "lucide-react"

const Navbar = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const pathname = usePathname()

  // Mock authentication for preview
  const isSignedIn = false

  const handleAuthClick = () => {
    setShowAuthDialog(true)
  }

  // Determine current game mode based on path
  const getCurrentMode = () => {
    if (pathname === "/endless") {
      return { name: "Endless Challenge", icon: <Infinity className="h-5 w-5 mr-2" /> }
    } else if (pathname === "/expert") {
      return { name: "Expert Gauntlet", icon: <Trophy className="h-5 w-5 mr-2" /> }
    } else if (pathname === "/architect") {
      return { name: "Sokoban Architect", icon: <Pencil className="h-5 w-5 mr-2" /> }
    } else if (pathname === "/challenges") {
      return { name: "Challenges", icon: <Gamepad2 className="h-5 w-5 mr-2" /> }
    }
    return null
  }

  const currentMode = getCurrentMode()

  return (
    <nav className="py-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/" className="font-pixel text-lg">
          SOKOVERSE
        </Link>

        {currentMode && (
          <div className="ml-6 flex items-center text-primary/80 font-pixel text-sm">
            <span className="mx-2">|</span>
            <div className="flex items-center">
              {currentMode.icon}
              {currentMode.name}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2 items-center">
        {isSignedIn ? (
          <div className="flex items-center mr-4">
            <Button size="sm" variant="outline" className="w-8 h-8 rounded-full p-0">
              <User className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Button size="sm" className="font-pixel text-xs mr-4" onClick={() => handleAuthClick()}>
              Sign In
            </Button>
          </>
        )}
        <ThemeSwitcher />
      </div>

      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
    </nav>
  )
}

export default Navbar

