import {
  Bot,
  BarChart2,
  Cast,
  MessageCircle,
  Box,
  Activity,
  Map,
  Aperture,
  Thermometer,
  Award,
  Link,
  UserCheck,
  UserPlus,
  Layout,
  BarChart,
  ChartNoAxesCombined,
  FileSearch2,
} from "lucide-react";

const HandCoins = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-hand-coins-icon lucide-hand-coins"
  >
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <path d="m2 16 6 6" />
    <circle cx="16" cy="9" r="2.9" />
    <circle cx="6" cy="5" r="3" />
  </svg>
);

const BitCoin = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-bitcoin-icon lucide-bitcoin"
  >
    <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727" />
  </svg>
);

const Chart = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    class="lucide lucide-chart-no-axes-combined-icon lucide-chart-no-axes-combined"
  >
    <path d="M12 16v5" />
    <path d="M16 14v7" />
    <path d="M20 10v11" />
    <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
    <path d="M4 18v3" />
    <path d="M8 14v7" />
  </svg>
);

export const iconMapper = {
  "lucide-bot": Bot,
  "bar-chart-2": BarChart2,
  cast: Cast,
  "message-circle": MessageCircle,
  box: Box,
  activity: Activity,
  map: Map,
  aperture: Aperture,
  thermometer: Thermometer,
  award: Award,
  link: Link,
  "user-check": UserCheck,
  "user-plus": UserPlus,
  layout: Layout,
  "bar-chart": BarChart,
  "lucide-bitcoin": BitCoin,
  "lucide-hand-coins": HandCoins,
  "lucide-chart": ChartNoAxesCombined,
  "lucide-file-search": FileSearch2,

  "feather-bar-chart-2": BarChart2,
  "feather-cast": Cast,
  "feather-message-circle": MessageCircle,
  "feather-box": Box,
  "feather-activity": Activity,
  "feather-map": Map,
  "feather-aperture": Aperture,
  "feather-thermometer": Thermometer,
  "feather-award": Award,
  "feather-link": Link,
  "feather-user-check": UserCheck,
  "feather-user-plus": UserPlus,
  "feather-layout": Layout,
  "feather-bar-chart": BarChart,
};

export const IconRenderer = ({
  iconName,
  size = 24,
  color = "currentColor",
  className = "",
  ...props
}) => {
  const IconComponent = iconMapper[iconName];

  if (!IconComponent) {
    console.warn(`Icon ${iconName} not found`);
    return <Box size={size} color={color} className={className} {...props} />;
  }

  return (
    <IconComponent size={size} color={color} className={className} {...props} />
  );
};
