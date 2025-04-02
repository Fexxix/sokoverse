"use client"

import type React from "react"

import { useState, useEffect } from "react"
import BlinkingCursor from "./BlinkingCursor"

interface TypingEffectProps {
  phrases: string[]
  typingSpeed: number
  deletingSpeed: number
  delayBetweenPhrases: number
}

const TypingEffect: React.FC<TypingEffectProps> = ({ phrases, typingSpeed, deletingSpeed, delayBetweenPhrases }) => {
  const [currentText, setCurrentText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (isWaiting) {
      timeout = setTimeout(() => {
        setIsWaiting(false)
        setIsDeleting(true)
      }, delayBetweenPhrases)
      return () => clearTimeout(timeout)
    }

    const currentPhrase = phrases[currentIndex]

    if (isDeleting) {
      if (currentText === "") {
        setIsDeleting(false)
        setCurrentIndex((prevIndex) => (prevIndex + 1) % phrases.length)
      } else {
        timeout = setTimeout(() => {
          setCurrentText(currentText.slice(0, -1))
        }, deletingSpeed)
      }
    } else {
      if (currentText === currentPhrase) {
        setIsWaiting(true)
      } else {
        timeout = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1))
        }, typingSpeed)
      }
    }

    return () => clearTimeout(timeout)
  }, [currentText, currentIndex, isDeleting, isWaiting, phrases, typingSpeed, deletingSpeed, delayBetweenPhrases])

  return (
    <div className="text-xl font-mono mb-8 flex items-center justify-center">
      <span>{currentText}</span>
      <BlinkingCursor />
    </div>
  )
}

export default TypingEffect

