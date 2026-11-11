import type { MindNode } from '@/types/mindmap'

interface MapThumbnailProps {
  nodes: MindNode[]
  primaryColor: string
  className?: string
}

export function MapThumbnail({ nodes, primaryColor, className = '' }: MapThumbnailProps) {
  if (!nodes.length) {
    return (
      <div className={`grid place-items-center bg-[#f7f8fc] ${className}`}>
        <div
          className="h-14 w-36 rounded-xl opacity-80 shadow-sm"
          style={{ backgroundColor: primaryColor }}
        />
      </div>
    )
  }

  const width = 720
  const height = 390
  const minX = Math.min(...nodes.map((node) => node.x)) - 160
  const maxX = Math.max(...nodes.map((node) => node.x)) + 160
  const minY = Math.min(...nodes.map((node) => node.y)) - 80
  const maxY = Math.max(...nodes.map((node) => node.y)) + 80
  const scale = Math.min(width / Math.max(maxX - minX, 1), height / Math.max(maxY - minY, 1))
  const offsetX = (width - (maxX - minX) * scale) / 2 - minX * scale
  const offsetY = (height - (maxY - minY) * scale) / 2 - minY * scale
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <div className={`overflow-hidden bg-[#f7f8fc] ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        role="img"
        aria-label="Miniatura do mapa mental"
      >
        <defs>
          <pattern
            id={`dots-${nodes[0]?.map}`}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.2" fill="#dcdfea" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill={`url(#dots-${nodes[0]?.map})`} />
        {nodes.map((node) => {
          const parent = node.parent ? nodeById.get(node.parent) : undefined
          if (!parent) return null
          const x1 = parent.x * scale + offsetX
          const y1 = parent.y * scale + offsetY
          const x2 = node.x * scale + offsetX
          const y2 = node.y * scale + offsetY
          const midX = (x1 + x2) / 2
          return (
            <path
              key={`edge-${node.id}`}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke={node.color}
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.72"
            />
          )
        })}
        {nodes.map((node) => {
          const x = node.x * scale + offsetX
          const y = node.y * scale + offsetY
          const isRoot = !node.parent
          const nodeWidth = Math.max(86, Math.min(190, node.text.length * 8 + 28))
          const radius = node.shape === 'pill' ? 22 : node.shape === 'rectangle' ? 4 : 12
          return (
            <g key={node.id}>
              <rect
                x={x - nodeWidth / 2}
                y={y - 25}
                width={nodeWidth}
                height="50"
                rx={radius}
                fill={node.color || primaryColor}
                opacity={isRoot ? 1 : 0.92}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fill="white"
                fontSize={isRoot ? 17 : 14}
                fontWeight={isRoot ? 700 : 600}
              >
                {node.text.length > 22 ? `${node.text.slice(0, 20)}…` : node.text}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
