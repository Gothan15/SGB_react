/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  darkMode: ["class", "class"], // Esto permite cambiar entre temas usando la clase 'dark'
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": {
            opacity: "1",
          },
          "20%,50%": {
            opacity: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        dot1: {
          "0%, 100%": {
            "border-color": "#ca8a04", // yellow-600
            transform:
              "rotateX(24deg) rotateY(20deg) rotateZ(0deg) translateZ(-25px)",
          },
          "50%": {
            "border-color": "#eab308", // yellow-500
            transform:
              "rotateX(20deg) rotateY(20deg) rotateZ(50deg) translateZ(0px)",
          },
        },
        dot2: {
          "0%, 100%": {
            "border-color": "#facc15", // yellow-400
            "box-shadow": "inset 0 0 15px 0 rgba(255, 255, 255, 0.2)",
            transform:
              "rotateX(24deg) rotateY(20deg) rotateZ(0deg) translateZ(-25px)",
          },
          "50%": {
            "border-color": "#fde047", // yellow-300
            "box-shadow": "inset 0 0 15px 0 rgba(255, 255, 255, 0.8)",
            transform:
              "rotateX(20deg) rotateY(20deg) rotateZ(50deg) translateZ(0px)",
          },
        },
        dot3: {
          "0%, 100%": {
            "border-color": "#fef08a", // yellow-200
            "box-shadow": "inset 0 0 15px 0 rgba(255, 255, 255, 0.1)",
            transform:
              "rotateX(24deg) rotateY(20deg) rotateZ(0deg) translateZ(-25px)",
          },
          "50%": {
            "border-color": "#fef9c3", // yellow-100
            "box-shadow": "inset 0 0 15px 0 rgba(255, 255, 255, 0.8)",
            transform:
              "rotateX(20deg) rotateY(20deg) rotateZ(50deg) translateZ(0px)",
          },
        },
        orbit1: {
          "0%": { transform: "rotate(0deg) translateX(60px) rotate(0deg)" },
          "100%": {
            transform: "rotate(360deg) translateX(60px) rotate(-360deg)",
          },
        },
        orbit2: {
          "0%": { transform: "rotate(90deg) translateX(60px) rotate(-90deg)" },
          "100%": {
            transform: "rotate(450deg) translateX(60px) rotate(-450deg)",
          },
        },
        orbit3: {
          "0%": {
            transform: "rotate(180deg) translateX(60px) rotate(-180deg)",
          },
          "100%": {
            transform: "rotate(540deg) translateX(60px) rotate(-540deg)",
          },
        },
        orbit4: {
          "0%": {
            transform: "rotate(270deg) translateX(60px) rotate(-270deg)",
          },
          "100%": {
            transform: "rotate(630deg) translateX(60px) rotate(-630deg)",
          },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        dot1: "dot1 1666ms cubic-bezier(.49,.06,.43,.85) infinite",
        dot2: "dot2 1666ms cubic-bezier(.49,.06,.43,.85) infinite 75ms",
        dot3: "dot3 1666ms cubic-bezier(.49,.06,.43,.85) infinite 150ms",
        "spin-slow": "spin 3s linear infinite",
        orbit1: "orbit1 1.6666666s linear infinite",
        orbit2: "orbit2 1.6666666s linear infinite",
        orbit3: "orbit3 1.6666666s linear infinite",
        orbit4: "orbit4 1.6666666s linear infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
});
