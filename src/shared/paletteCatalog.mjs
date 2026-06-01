const paletteCatalog = [
  {
    id: "mixed",
    name: "Mixed",
    category: "Balanced",
    colors: ["#F1C40F", "#E67E22", "#16A085", "#2980B9", "#D35400"],
  },
  {
    id: "ocean",
    name: "Ocean",
    category: "Cool",
    colors: ["#005f99", "#33ccff", "#66d9ff", "#b3ecff", "#e6f9ff"],
  },
  {
    id: "galaxy",
    name: "Galaxy",
    category: "Cool",
    colors: ["#2E2B5F", "#3626A7", "#4B3CF7", "#7055F1", "#9278F1"],
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "Warm",
    colors: ["#FF4E50", "#FC913A", "#F9D423", "#EDE574", "#E1F5C4"],
  },
  {
    id: "sunrise",
    name: "Sunrise",
    category: "Warm",
    colors: ["#FF5F6D", "#FFC371", "#FF9A8B", "#FF6A88", "#FFB19A"],
  },
  {
    id: "forest",
    name: "Forest",
    category: "Natural",
    colors: ["#004d00", "#336600", "#4d9900", "#66cc00", "#b3ff66"],
  },
  {
    id: "earth",
    name: "Earth",
    category: "Natural",
    colors: ["#A0522D", "#CD853F", "#DEB887", "#F5DEB3", "#FFF8DC"],
  },
  {
    id: "pastel",
    name: "Pastel",
    category: "Soft",
    colors: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF"],
  },
  {
    id: "neon",
    name: "Neon",
    category: "Vivid",
    colors: ["#FF6EC7", "#FFD700", "#FF4500", "#7FFF00", "#7FFFD4"],
  },
  {
    id: "candy",
    name: "Candy",
    category: "Vivid",
    colors: ["#FF6347", "#FFD700", "#FF69B4", "#FF1493", "#FF4500"],
  },
  {
    id: "warm",
    name: "Warm",
    category: "Warm",
    colors: ["#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300"],
  },
  {
    id: "cool",
    name: "Cool",
    category: "Cool",
    colors: ["#3498DB", "#2ECC71", "#1ABC9C", "#E74C3C", "#8E44AD"],
  },
];

function listPaletteEntries() {
  return paletteCatalog.map((entry) => ({
    ...entry,
    colors: [...entry.colors],
  }));
}

function getPaletteEntry(paletteId) {
  return (
    paletteCatalog.find((entry) => entry.id === paletteId) ||
    paletteCatalog.find((entry) => entry.id === "mixed")
  );
}

function getPaletteColors(paletteId) {
  return [...(getPaletteEntry(paletteId)?.colors || ["#000000"])];
}

function getPaletteCategories() {
  return Array.from(new Set(paletteCatalog.map((entry) => entry.category)));
}

function randomPaletteId(rng = Math.random) {
  const index = Math.floor(rng() * paletteCatalog.length);
  return paletteCatalog[index]?.id || "mixed";
}

export {
  getPaletteCategories,
  getPaletteColors,
  getPaletteEntry,
  listPaletteEntries,
  paletteCatalog,
  randomPaletteId,
};
