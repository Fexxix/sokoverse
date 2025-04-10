const SokoverseLogo: React.FC = () => {
  return (
    <div className="w-24 h-24 grid grid-cols-8 grid-rows-8 gap-0.5 mb-4 relative">
      {/* Box outline */}
      <div className="absolute inset-0 border-2 border-primary rounded-sm"></div>

      {/* S */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-primary"></div>
      <div className="absolute top-1 left-3 w-2 h-2 bg-primary"></div>
      <div className="absolute top-1 left-5 w-2 h-2 bg-primary"></div>
      <div className="absolute top-3 left-1 w-2 h-2 bg-primary"></div>
      <div className="absolute top-5 left-3 w-2 h-2 bg-primary"></div>
      <div className="absolute top-5 left-5 w-2 h-2 bg-primary"></div>
      <div className="absolute top-7 left-1 w-2 h-2 bg-transparent"></div>
      <div className="absolute top-7 left-3 w-2 h-2 bg-transparent"></div>
      <div className="absolute top-7 left-5 w-2 h-2 bg-primary"></div>
      <div className="absolute top-9 left-1 w-2 h-2 bg-primary"></div>
      <div className="absolute top-9 left-3 w-2 h-2 bg-primary"></div>
      <div className="absolute top-9 left-5 w-2 h-2 bg-primary"></div>

      {/* Player */}
      <div className="absolute top-3 left-11 w-2 h-2 bg-primary animate-pulse"></div>

      {/* Box */}
      <div className="absolute top-5 left-9 w-2 h-2 bg-yellow-600"></div>

      {/* Target */}
      <div className="absolute top-5 left-13 w-2 h-2 border border-dashed border-primary"></div>
    </div>
  )
}

export default SokoverseLogo
