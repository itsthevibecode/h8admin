const SIZE = 25
const FINDER = 7

function isInFinderZone(x: number, y: number) {
  const nearStart = (v: number) => v <= FINDER
  const nearEnd = (v: number) => v >= SIZE - FINDER - 1
  return (
    (nearStart(x) && nearStart(y)) || (nearEnd(x) && nearStart(y)) || (nearStart(x) && nearEnd(y))
  )
}

function isInLogoZone(x: number, y: number) {
  const center = Math.floor(SIZE / 2)
  return Math.abs(x - center) <= 3 && Math.abs(y - center) <= 3
}

function buildModules() {
  let seed = 0x8a5f
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const modules: Array<[number, number]> = []
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const filled = random() > 0.52
      if (filled && !isInFinderZone(x, y) && !isInLogoZone(x, y)) modules.push([x, y])
    }
  }
  return modules
}

const MODULES = buildModules()
const FINDER_ORIGINS: Array<[number, number]> = [
  [0, 0],
  [SIZE - FINDER, 0],
  [0, SIZE - FINDER],
]

export function MockQrCode({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`-1 -1 ${SIZE + 2} ${SIZE + 2}`}
      className={className}
      role="img"
      aria-label="QR code to scan with your authenticator app"
      shapeRendering="crispEdges"
    >
      <rect x={-1} y={-1} width={SIZE + 2} height={SIZE + 2} fill="white" />
      <g className="fill-foreground">
        {MODULES.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
        ))}
      </g>
      {FINDER_ORIGINS.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={7} height={7} rx={1.2} className="fill-foreground" />
          <rect x={x + 1} y={y + 1} width={5} height={5} rx={0.8} fill="white" />
          <rect x={x + 2} y={y + 2} width={3} height={3} rx={0.6} className="fill-primary" />
        </g>
      ))}
      <rect x={9.5} y={9.5} width={6} height={6} rx={1.4} className="fill-primary" />
      <text
        x={12.5}
        y={13.4}
        textAnchor="middle"
        fontSize={2.6}
        fontWeight={700}
        fill="white"
        fontFamily="ui-monospace, monospace"
      >
        H8
      </text>
    </svg>
  )
}
