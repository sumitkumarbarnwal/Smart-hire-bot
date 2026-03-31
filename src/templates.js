// ─── Resume PDF Templates ───────────────────────────────────
// Each template defines colors, fonts, layout for PDF generation

const TEMPLATES = {
  modern: {
    name: "✨ Modern",
    description: "Clean blue accents with bold section headers",
    colors: {
      primary: "#1a73e8",
      dark: "#202124",
      secondary: "#5f6368",
      divider: "#dadce0",
      headerBg: null,
      nameBg: null,
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
      name: "Helvetica-Bold",
    },
    sizes: {
      name: 22,
      contact: 9,
      heading: 13,
      body: 10,
    },
    style: {
      accentBar: true,
      accentBarHeight: 6,
      sectionDivider: true,
      bulletStyle: "circle", // circle | dash | arrow
      nameAlign: "left",
      contactAlign: "left",
    },
  },

  classic: {
    name: "📜 Classic",
    description: "Traditional black & white with serif feel",
    colors: {
      primary: "#1a1a1a",
      dark: "#000000",
      secondary: "#444444",
      divider: "#999999",
      headerBg: null,
      nameBg: null,
    },
    fonts: {
      heading: "Times-Bold",
      body: "Times-Roman",
      name: "Times-Bold",
    },
    sizes: {
      name: 24,
      contact: 10,
      heading: 12,
      body: 11,
    },
    style: {
      accentBar: false,
      accentBarHeight: 0,
      sectionDivider: true,
      bulletStyle: "dash",
      nameAlign: "center",
      contactAlign: "center",
    },
  },

  minimal: {
    name: "🤍 Minimal",
    description: "Ultra clean with subtle gray tones",
    colors: {
      primary: "#555555",
      dark: "#333333",
      secondary: "#888888",
      divider: "#e0e0e0",
      headerBg: null,
      nameBg: null,
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
      name: "Helvetica",
    },
    sizes: {
      name: 20,
      contact: 9,
      heading: 11,
      body: 10,
    },
    style: {
      accentBar: false,
      accentBarHeight: 0,
      sectionDivider: false,
      bulletStyle: "dash",
      nameAlign: "left",
      contactAlign: "left",
    },
  },

  executive: {
    name: "🏢 Executive",
    description: "Bold dark header with gold accents",
    colors: {
      primary: "#1B2A4A",
      dark: "#1a1a1a",
      secondary: "#555555",
      divider: "#cccccc",
      headerBg: "#1B2A4A",
      nameBg: "#1B2A4A",
      nameText: "#FFFFFF",
      contactText: "#D4AF37",
      accent: "#D4AF37",
    },
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
      name: "Helvetica-Bold",
    },
    sizes: {
      name: 24,
      contact: 10,
      heading: 13,
      body: 10,
    },
    style: {
      accentBar: true,
      accentBarHeight: 4,
      accentBarColor: "#D4AF37",
      sectionDivider: true,
      bulletStyle: "arrow",
      nameAlign: "center",
      contactAlign: "center",
      nameBlock: true, // Dark background block for name
      nameBlockHeight: 85,
    },
  },
};

const TEMPLATE_IDS = Object.keys(TEMPLATES);

module.exports = { TEMPLATES, TEMPLATE_IDS };
