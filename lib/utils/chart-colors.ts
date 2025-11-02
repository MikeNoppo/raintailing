export function generateChartColor(index: number): string {
  const hues = [220, 142, 47, 280, 348, 24, 180, 310, 80, 200, 330, 60]
  const hue = hues[index % hues.length]
  return `hsl(${hue}, 70%, 50%)`
}

export function generateChartConfig(locations: Array<{ code: string; name: string }>) {
  const config: Record<string, { label: string; color: string }> = {}
  
  locations.forEach((location, index) => {
    config[location.code] = {
      label: location.name,
      color: generateChartColor(index)
    }
  })
  
  return config
}
