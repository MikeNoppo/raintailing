// Rainfall classification based on Indonesian meteorological standards
export const rainfallCategories = {
  tidakHujan: {
    label: "Tidak Hujan",
    description: "0 mm",
    min: 0,
    max: 0,
    color: "#94a3b8", // gray
    emoji: "☀️"
  },
  ringan: {
    label: "Hujan Ringan",
    description: "0.1 - 20 mm per hari",
    min: 0.1,
    max: 20,
    color: "#22c55e", // green
    emoji: "🌦️"
  },
  sedang: {
    label: "Hujan Sedang", 
    description: "20 - 50 mm per hari",
    min: 20,
    max: 50,
    color: "#f59e0b", // amber
    emoji: "☔"
  },
  lebat: {
    label: "Hujan Lebat",
    description: "lebih dari 50 mm per hari", 
    min: 50,
    max: Infinity,
    color: "#ef4444", // red
    emoji: "🌧️"
  }
} as const

// Function to classify rainfall amount
export const classifyRainfall = (amount: number): keyof typeof rainfallCategories => {
  if (amount === 0) return "tidakHujan"
  if (amount > 0 && amount <= 20) return "ringan"
  if (amount > 20 && amount <= 50) return "sedang"
  return "lebat"
}
