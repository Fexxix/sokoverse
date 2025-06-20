"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import ThemeSwitcher from "@/components/ThemeSwitcher"
import AuthDialog from "@/components/AuthDialog"
import { Infinity, Vault, Pencil, Terminal, Target } from "lucide-react"
import { useAuth } from "@/contexts/auth"
import { UserButton } from "@/components/UserButton"

const Navbar = () => {
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  const handleAuthClick = () => {
    setShowAuthDialog(true)
  }

  // Determine current game mode based on path
  const getCurrentMode = () => {
    if (pathname.startsWith("/endless")) {
      return {
        name: "Endless Challenge",
        icon: <Infinity className="h-5 w-5 mr-2" />,
      }
    } else if (pathname.startsWith("/spike-vaults")) {
      return {
        name: "Spike Vaults",
        icon: <Vault className="h-5 w-5 mr-2" />,
      }
    } else if (pathname.startsWith("/boxoban")) {
      return {
        name: "Boxoban Challenge",
        icon: <Target className="h-5 w-5 mr-2" />,
      }
    } else if (pathname.startsWith("/architect")) {
      return {
        name: "Sokoban Architect",
        icon: <Pencil className="h-5 w-5 mr-2" />,
      }
    } else if (pathname.startsWith("/terminal")) {
      return {
        name: "Game Terminal",
        icon: <Terminal className="h-5 w-5 mr-2" />,
      }
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
        {isAuthenticated ? (
          <div className="flex items-center mr-4">
            <UserButton />
          </div>
        ) : (
          <>
            <Button
              size="sm"
              className="font-pixel text-xs mr-4"
              onClick={handleAuthClick}
            >
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
