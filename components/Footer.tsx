import Link from "next/link"

const Footer = () => {
  return (
    <footer className="py-8 text-center">
      <div className="flex justify-center space-x-4 mb-4">
        <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">
          About
        </Link>
        <span className="text-primary/50">|</span>
        <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors">
          Contact
        </Link>
        <span className="text-primary/50">|</span>
        <Link href="/privacy" className="text-sm font-medium hover:text-primary transition-colors">
          Privacy Policy
        </Link>
      </div>
      <p className="text-sm text-primary/70 font-medium">© 2023 Sokoverse. All rights reserved.</p>
    </footer>
  )
}

export default Footer

