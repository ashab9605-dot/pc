/* ==========================================================================
   PC STUDIO — DEFAULT SITE CONFIG (WITH COLORS, IMAGES & CUSTOM FONTS)
   AND STARTER POSTER TEMPLATES
   ========================================================================== */

window.POSTER_STUDIO_BUILTIN_FONTS = [
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Oswald",
  "Bebas Neue",
  "Inter",
  "Roboto",
  "Raleway",
  "Cinzel",
  "Dancing Script",
  "Noto Sans Malayalam",
  "Anek Malayalam",
  "Manjari",
  "Gayathri"
];

window.POSTER_STUDIO_DEFAULTS = {
  lastUpdated: Date.now(),
  customFonts: [],
  siteConfig: {
    brandName: "PC STUDIO",
    brandTagline: "Curved Dark Poster Studio",
    brandLogoUrl: "",
    entranceTitle: "PC STUDIO",
    entranceSubtitle: "Curve Your Vision • Design Your Thoughts",
    entranceEnabled: true,

    sections: {
      hero: true,
      marquee: true,
      about: true,
      templates: true,
      contact: true
    },

    colors: {
      pageBg: "#050508",
      cardBg: "#11131d",
      accent: "#7c5cff",
      accent2: "#22d3ee",
      gold: "#e6be63",
      brandText: "#f5f7ff",
      brandTagline: "#6c7491",
      entranceBg: "#050508",
      entranceTitle: "#ffffff",
      entranceSub: "#a2a9c4",
      heroBadgeBg: "#1e1738",
      heroBadgeText: "#b8a6ff",
      heroHeadingStart: "#ffffff",
      heroHeadingEnd: "#7de9ff",
      heroSubtitle: "#a2a9c4",
      heroPrimaryBg: "#7c5cff",
      heroPrimaryText: "#ffffff",
      heroSecondaryBg: "#181b28",
      heroSecondaryText: "#f5f7ff",
      marqueeText: "#a2a9c4",
      marqueeDot: "#7c5cff",
      aboutTitle: "#f5f7ff",
      aboutText: "#a2a9c4",
      templatesTitle: "#f5f7ff",
      templatesSubtitle: "#a2a9c4",
      contactTitle: "#f5f7ff",
      contactSubtitle: "#a2a9c4",
      founderName: "#ffffff",
      founderInfoText: "#f5f7ff",
      footerText: "#a2a9c4"
    },

    heroBadge: "Ultra-HD 5MB+ Poster Templates",
    heroBgImageUrl: "",
    movingHeadings: [
      "Curve Your Vision & Design Your Thoughts",
      "Craft Studio-Grade Posters In Seconds",
      "Edit Live. Export Lossless 5MB+ Quality.",
      "Where Dark Aesthetics Meet Print Precision"
    ],
    heroSubtitle:
      "Pick a curved-dark studio poster template, personalize every name, date, and photo with live half-scene preview, and download print-ready posters above 5MB with zero quality loss.",
    heroPrimaryBtn: "Explore Templates",
    heroSecondaryBtn: "Contact Founder",

    marqueeItems: [
      "Curve Your Vision",
      "Design Your Thoughts",
      "Live Half-Scene Preview",
      "5MB+ Ultra-HD Print PNG",
      "Poppins & Custom Font Engine",
      "PSD Studio Powered"
    ],

    aboutTitle: "Built For Creators, Events & Bold Brands",
    aboutText:
      "PC STUDIO brings Photoshop-grade poster layouts directly to your browser. Every template is engineered with editable typography, instant photo framing, and ultra-high-resolution lossless export so your posters look razor-sharp on social media and large prints alike.",
    aboutImageUrl: "",
    aboutHighlights: [
      {
        id: "hl_1",
        icon: "⚡",
        imageUrl: "",
        title: "Real-Time Half-Scene Preview",
        desc: "Type your name, date, or title and watch the poster transform instantaneously side by side.",
        titleColor: "#f5f7ff",
        descColor: "#a2a9c4",
        cardBg: "#141724",
        visible: true
      },
      {
        id: "hl_2",
        icon: "💎",
        imageUrl: "",
        title: "5MB+ Zero-Loss Quality Export",
        desc: "Every download renders at ultra-high 300 DPI print scale so details never blur or compress.",
        titleColor: "#f5f7ff",
        descColor: "#a2a9c4",
        cardBg: "#141724",
        visible: true
      },
      {
        id: "hl_3",
        icon: "🎨",
        imageUrl: "",
        title: "Full Typography & Studio Control",
        desc: "Fine-tune font family, custom uploaded fonts, size, bold weight, color, and alignment live.",
        titleColor: "#f5f7ff",
        descColor: "#a2a9c4",
        cardBg: "#141724",
        visible: true
      }
    ],

    templatesTitle: "Featured Poster Templates",
    templatesSubtitle:
      "Tap any poster below to open the live customizer, edit your details, and download in ultra-high resolution.",

    contactTitle: "Connect With The Founder",
    contactSubtitle:
      "Need a custom poster pack, event branding, or bespoke PSD template? Reach out directly or drop a message below.",
    founderName: "ASHABE PC",
    founderImageUrl: "",
    phoneNumber: "+91 9605160931",
    instagramHandle: "@iam_sabuu",
    locationText: "Kerala, India",
    footerNote: "Crafted with precision by ASHABE PC • PC STUDIO All Rights Reserved."
  },

  templates: [
    {
      id: "tpl_leaders_summit",
      name: "Leaders Summit '26",
      category: "Event",
      description: "Modern clean event poster with curved profile frame, bold Poppins headline, and date badge.",
      visible: true,
      width: 1122,
      height: 1400,
      background: { type: "solid", color1: "#f8fafc", color2: "#e2e8f0", angle: 135, imageUrl: "" },
      layers: [
        {
          id: "l_top_accent", type: "shape", name: "Top Ribbon Accent", shapeType: "rect",
          x: 240, y: 72, width: 520, height: 110, rotation: -18, opacity: 100, visible: true, locked: false,
          fill: "#0f766e", stroke: "", strokeWidth: 0, cornerRadius: 55, editable: false
        },
        {
          id: "l_top_accent2", type: "shape", name: "Top Secondary Ribbon", shapeType: "rect",
          x: 150, y: 38, width: 420, height: 74, rotation: -18, opacity: 100, visible: true, locked: false,
          fill: "#0284c7", stroke: "", strokeWidth: 0, cornerRadius: 40, editable: false
        },
        {
          id: "l_org", type: "text", name: "Organization", text: "PC STUDIO LEADERSHIP CLUSTER",
          x: 800, y: 170, width: 520, height: 70, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 28, fontWeight: "700", fontStyle: "normal",
          color: "#0f2f4f", align: "right", letterSpacing: 1.2, lineHeight: 1.2,
          editable: true, editableLabel: "Organization / Header"
        },
        {
          id: "l_photo", type: "photo", name: "Profile Photo",
          x: 270, y: 585, width: 340, height: 420, rotation: 0, opacity: 100, visible: true, locked: false,
          src: "", fit: "cover", cornerRadius: 48, fill: "#357ca5", stroke: "#0f2f4f", strokeWidth: 4,
          editable: true, editableLabel: "Upload Speaker / Member Photo"
        },
        {
          id: "l_heading", type: "text", name: "Main Heading", text: "FORWARD",
          x: 790, y: 475, width: 560, height: 110, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 82, fontWeight: "800", fontStyle: "normal",
          color: "#0c3b5e", align: "right", letterSpacing: 2, lineHeight: 1.05,
          editable: true, editableLabel: "Main Event Title"
        },
        {
          id: "l_subhead", type: "text", name: "Subtitle", text: "Leaders Summit '26",
          x: 790, y: 552, width: 560, height: 55, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 34, fontWeight: "600", fontStyle: "normal",
          color: "#0f766e", align: "right", letterSpacing: 0.5, lineHeight: 1.2,
          editable: true, editableLabel: "Event Subtitle"
        },
        {
          id: "l_desc", type: "text", name: "Description",
          text: "Join us for an inspiring leadership summit focused on vision, creative growth, unity, and impactful community initiatives.",
          x: 790, y: 690, width: 520, height: 180, rotation: 0, opacity: 90, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 22, fontWeight: "400", fontStyle: "normal",
          color: "#334155", align: "right", letterSpacing: 0, lineHeight: 1.45,
          editable: true, editableLabel: "Event Description"
        },
        {
          id: "l_name", type: "text", name: "Participant Name", text: "ASHABE PC",
          x: 270, y: 848, width: 360, height: 54, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 32, fontWeight: "700", fontStyle: "normal",
          color: "#0c3b5e", align: "center", letterSpacing: 0.5, lineHeight: 1.2,
          editable: true, editableLabel: "Your Name"
        },
        {
          id: "l_unit", type: "text", name: "Unit / Designation", text: "Creative Director • Kerala",
          x: 270, y: 892, width: 360, height: 40, rotation: 0, opacity: 85, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 21, fontWeight: "500", fontStyle: "normal",
          color: "#475569", align: "center", letterSpacing: 0.3, lineHeight: 1.2,
          editable: true, editableLabel: "Unit / Designation"
        },
        {
          id: "l_date_badge", type: "shape", name: "Date Pill", shapeType: "rect",
          x: 960, y: 878, width: 210, height: 74, rotation: 0, opacity: 100, visible: true, locked: false,
          fill: "#0c3b5e", stroke: "", strokeWidth: 0, cornerRadius: 20, editable: false
        },
        {
          id: "l_date", type: "text", name: "Event Date", text: "NOV 28 • 6:30 PM",
          x: 960, y: 880, width: 200, height: 48, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 22, fontWeight: "700", fontStyle: "normal",
          color: "#ffffff", align: "center", letterSpacing: 0.6, lineHeight: 1.1,
          editable: true, editableLabel: "Date & Time"
        },
        {
          id: "l_pattern_bar", type: "shape", name: "Bottom Accent Bar", shapeType: "rect",
          x: 561, y: 1120, width: 920, height: 96, rotation: 0, opacity: 100, visible: true, locked: false,
          fill: "#0f766e", stroke: "", strokeWidth: 0, cornerRadius: 28, editable: false
        },
        {
          id: "l_footer_line", type: "text", name: "Footer Tag", text: "CURVE YOUR VISION • DESIGN YOUR THOUGHTS",
          x: 561, y: 1122, width: 880, height: 48, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 24, fontWeight: "700", fontStyle: "normal",
          color: "#ffffff", align: "center", letterSpacing: 2.5, lineHeight: 1.2,
          editable: true, editableLabel: "Bottom Tagline"
        }
      ]
    },
    {
      id: "tpl_dark_fest",
      name: "Midnight Arts Fest",
      category: "Festival",
      description: "Electric obsidian & violet festival poster built for Instagram portrait and print banners.",
      visible: true,
      width: 1080,
      height: 1350,
      background: { type: "gradient", color1: "#090a14", color2: "#1f123d", angle: 145, imageUrl: "" },
      layers: [
        {
          id: "f_glow", type: "shape", name: "Violet Orb", shapeType: "circle",
          x: 840, y: 240, width: 540, height: 540, rotation: 0, opacity: 35, visible: true, locked: false,
          fill: "#7c5cff", stroke: "", strokeWidth: 0, cornerRadius: 270, editable: false
        },
        {
          id: "f_badge_bg", type: "shape", name: "Top Pill", shapeType: "rect",
          x: 540, y: 150, width: 420, height: 58, rotation: 0, opacity: 100, visible: true, locked: false,
          fill: "#7c5cff", stroke: "", strokeWidth: 0, cornerRadius: 30, editable: false
        },
        {
          id: "f_badge_txt", type: "text", name: "Top Label", text: "ANNUAL CREATIVE EDITION",
          x: 540, y: 152, width: 400, height: 40, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 22, fontWeight: "700", fontStyle: "normal",
          color: "#ffffff", align: "center", letterSpacing: 2.2, lineHeight: 1.1,
          editable: true, editableLabel: "Top Badge Text"
        },
        {
          id: "f_title", type: "text", name: "Fest Title", text: "NEON WAVE\nFESTIVAL '26",
          x: 540, y: 390, width: 920, height: 260, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 102, fontWeight: "800", fontStyle: "normal",
          color: "#ffffff", align: "center", letterSpacing: -1, lineHeight: 1.06,
          editable: true, editableLabel: "Main Festival Title"
        },
        {
          id: "f_photo", type: "photo", name: "Featured Artist Photo",
          x: 540, y: 760, width: 420, height: 420, rotation: 0, opacity: 100, visible: true, locked: false,
          src: "", fit: "cover", cornerRadius: 64, fill: "#1d2238", stroke: "#7c5cff", strokeWidth: 6,
          editable: true, editableLabel: "Upload Featured Photo"
        },
        {
          id: "f_guest", type: "text", name: "Guest / Presenter", text: "FEATURING ASHABE PC",
          x: 540, y: 1055, width: 840, height: 64, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 40, fontWeight: "700", fontStyle: "normal",
          color: "#e6be63", align: "center", letterSpacing: 1.5, lineHeight: 1.2,
          editable: true, editableLabel: "Guest / Performer Name"
        },
        {
          id: "f_date", type: "text", name: "Date & Venue", text: "DECEMBER 14, 2026  •  KOZHIKODE ARENA",
          x: 540, y: 1145, width: 900, height: 50, rotation: 0, opacity: 90, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 26, fontWeight: "500", fontStyle: "normal",
          color: "#cbd5e1", align: "center", letterSpacing: 1.2, lineHeight: 1.2,
          editable: true, editableLabel: "Date & Venue"
        }
      ]
    },
    {
      id: "tpl_congrats_gold",
      name: "Royal Congratulation",
      category: "Achievement",
      description: "Obsidian black & luxury gold congratulation poster with rounded portrait card.",
      visible: true,
      width: 1080,
      height: 1080,
      background: { type: "gradient", color1: "#070709", color2: "#19150d", angle: 135, imageUrl: "" },
      layers: [
        {
          id: "c_frame", type: "shape", name: "Gold Frame", shapeType: "rect",
          x: 540, y: 540, width: 960, height: 960, rotation: 0, opacity: 100, visible: true, locked: false,
          fill: "transparent", stroke: "#e6be63", strokeWidth: 4, cornerRadius: 48, editable: false
        },
        {
          id: "c_top", type: "text", name: "Celebration Label", text: "HEARTIEST",
          x: 540, y: 155, width: 700, height: 50, rotation: 0, opacity: 95, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 28, fontWeight: "600", fontStyle: "normal",
          color: "#e6be63", align: "center", letterSpacing: 6, lineHeight: 1.1,
          editable: true, editableLabel: "Top Accent Word"
        },
        {
          id: "c_heading", type: "text", name: "Main Heading", text: "CONGRATULATIONS",
          x: 540, y: 228, width: 900, height: 90, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 66, fontWeight: "800", fontStyle: "normal",
          color: "#ffffff", align: "center", letterSpacing: 2, lineHeight: 1.1,
          editable: true, editableLabel: "Main Heading"
        },
        {
          id: "c_photo", type: "photo", name: "Achiever Photo",
          x: 540, y: 515, width: 370, height: 370, rotation: 0, opacity: 100, visible: true, locked: false,
          src: "", fit: "cover", cornerRadius: 185, fill: "#231e14", stroke: "#e6be63", strokeWidth: 7,
          editable: true, editableLabel: "Achiever Photo"
        },
        {
          id: "c_name", type: "text", name: "Achiever Name", text: "ASHABE PC",
          x: 540, y: 785, width: 820, height: 70, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 52, fontWeight: "800", fontStyle: "normal",
          color: "#e6be63", align: "center", letterSpacing: 1, lineHeight: 1.1,
          editable: true, editableLabel: "Winner / Achiever Name"
        },
        {
          id: "c_reason", type: "text", name: "Achievement Details",
          text: "First Prize • State Creative Design Championship 2026",
          x: 540, y: 868, width: 820, height: 80, rotation: 0, opacity: 90, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 27, fontWeight: "500", fontStyle: "normal",
          color: "#e2e8f0", align: "center", letterSpacing: 0.4, lineHeight: 1.35,
          editable: true, editableLabel: "Achievement Description"
        }
      ]
    },
    {
      id: "tpl_yt_thumb",
      name: "Creator YouTube Cover",
      category: "YouTube",
      description: "High-impact 1280×720 dark curved thumbnail template with bold contrast.",
      visible: true,
      width: 1280,
      height: 720,
      background: { type: "gradient", color1: "#070911", color2: "#111a2e", angle: 120, imageUrl: "" },
      layers: [
        {
          id: "y_card", type: "shape", name: "Highlight Pill", shapeType: "rect",
          x: 245, y: 155, width: 320, height: 56, rotation: 0, opacity: 100, visible: true, locked: false,
          fill: "#22d3ee", stroke: "", strokeWidth: 0, cornerRadius: 28, editable: false
        },
        {
          id: "y_tag", type: "text", name: "Episode Tag", text: "PC STUDIO GUIDE",
          x: 245, y: 157, width: 300, height: 40, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 22, fontWeight: "800", fontStyle: "normal",
          color: "#061018", align: "center", letterSpacing: 1.5, lineHeight: 1.1,
          editable: true, editableLabel: "Top Tag"
        },
        {
          id: "y_title", type: "text", name: "Video Title", text: "DESIGN POSTERS\nLIKE A PRO",
          x: 410, y: 370, width: 660, height: 240, rotation: 0, opacity: 100, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 78, fontWeight: "800", fontStyle: "normal",
          color: "#ffffff", align: "left", letterSpacing: -1, lineHeight: 1.08,
          editable: true, editableLabel: "Thumbnail Headline"
        },
        {
          id: "y_date", type: "text", name: "Channel / Date", text: "BY ASHABE PC  •  NEW RELEASE",
          x: 410, y: 575, width: 650, height: 48, rotation: 0, opacity: 90, visible: true, locked: false,
          fontFamily: "Poppins", fontSize: 26, fontWeight: "600", fontStyle: "normal",
          color: "#e6be63", align: "left", letterSpacing: 1.5, lineHeight: 1.2,
          editable: true, editableLabel: "Channel / Date"
        },
        {
          id: "y_photo", type: "photo", name: "Creator Portrait",
          x: 990, y: 360, width: 420, height: 540, rotation: 0, opacity: 100, visible: true, locked: false,
          src: "", fit: "cover", cornerRadius: 42, fill: "#1b243b", stroke: "#22d3ee", strokeWidth: 5,
          editable: true, editableLabel: "Upload Thumbnail Image"
        }
      ]
    }
  ],

  activityLog: [
    {
      id: "act_seed_1",
      type: "system",
      title: "PC STUDIO Initialized",
      detail: "PC STUDIO launched with 4 starter templates & instant live sync enabled.",
      timestamp: new Date().toISOString()
    }
  ],

  messages: []
};
