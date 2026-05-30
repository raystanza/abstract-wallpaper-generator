const colorPalettes = {
  warm: ["#FF5733", "#C70039", "#900C3F", "#581845", "#FFC300"],
  cool: ["#3498DB", "#2ECC71", "#1ABC9C", "#E74C3C", "#8E44AD"],
  mixed: ["#F1C40F", "#E67E22", "#16A085", "#2980B9", "#D35400"],
  sunrise: ["#FF5F6D", "#FFC371", "#FF9A8B", "#FF6A88", "#FFB19A"],
  sunset: ["#FF4E50", "#FC913A", "#F9D423", "#EDE574", "#E1F5C4"],
  forest: ["#004d00", "#336600", "#4d9900", "#66cc00", "#b3ff66"],
  ocean: ["#005f99", "#33ccff", "#66d9ff", "#b3ecff", "#e6f9ff"],
  pastel: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF"],
  neon: ["#FF6EC7", "#FFD700", "#FF4500", "#7FFF00", "#7FFFD4"],
  earth: ["#A0522D", "#CD853F", "#DEB887", "#F5DEB3", "#FFF8DC"],
  galaxy: ["#2E2B5F", "#3626A7", "#4B3CF7", "#7055F1", "#9278F1"],
  candy: ["#FF6347", "#FFD700", "#FF69B4", "#FF1493", "#FF4500"],
};

function getPaletteColors(paletteName) {
  return colorPalettes[paletteName] || null;
}

function getPaletteNames() {
  return Object.keys(colorPalettes);
}

function isPaletteName(paletteName) {
  return Object.prototype.hasOwnProperty.call(colorPalettes, paletteName);
}

module.exports = {
  colorPalettes,
  getPaletteColors,
  getPaletteNames,
  isPaletteName,
};
