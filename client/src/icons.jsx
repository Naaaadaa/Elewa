// Simple outline SVG icons. No emoji anywhere in Elewa.

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

function Icon({ size = 20, children, ...rest }) {
  return (
    <svg width={size} height={size} {...base} {...rest} aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconBook = (p) => (
  <Icon {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2v13a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 1 4 16V5.5Z" />
    <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H14a2 2 0 0 0-2 2v13a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 0 20 16V5.5Z" />
  </Icon>
);

export const IconChat = (p) => (
  <Icon {...p}>
    <path d="M20 12a7 7 0 0 1-7 7H8.5L5 21.5V17.2A7 7 0 0 1 11 5h2a7 7 0 0 1 7 7Z" />
    <path d="M9.5 11.5h5M9.5 14.5h3" />
  </Icon>
);

export const IconSpark = (p) => (
  <Icon {...p}>
    <path d="M12 3.5 13.6 8 18 9.6 13.6 11.2 12 15.7 10.4 11.2 6 9.6 10.4 8 12 3.5Z" />
    <path d="M18 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
  </Icon>
);

export const IconGrid = (p) => (
  <Icon {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.8" />
    <rect x="13" y="4" width="7" height="7" rx="1.8" />
    <rect x="4" y="13" width="7" height="7" rx="1.8" />
    <rect x="13" y="13" width="7" height="7" rx="1.8" />
  </Icon>
);

export const IconPlus = (p) => (
  <Icon {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Icon>
);

export const IconChevronLeft = (p) => (
  <Icon {...p}>
    <path d="M14.5 6 9 12l5.5 6" />
  </Icon>
);

export const IconChevronRight = (p) => (
  <Icon {...p}>
    <path d="M9.5 6 15 12l-5.5 6" />
  </Icon>
);

export const IconCamera = (p) => (
  <Icon {...p}>
    <path d="M4 9.5A2.5 2.5 0 0 1 6.5 7h1L9 5h6l1.5 2h1A2.5 2.5 0 0 1 20 9.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9.5Z" />
    <circle cx="12" cy="13" r="3.2" />
  </Icon>
);

export const IconSend = (p) => (
  <Icon {...p}>
    <path d="M5 12 20 5l-4.2 15L12 14l-7-2Z" />
    <path d="M12 14l3.8-6" />
  </Icon>
);

export const IconTeacher = (p) => (
  <Icon {...p}>
    <path d="M3.5 8.5 12 4.5l8.5 4L12 12.5 3.5 8.5Z" />
    <path d="M7 10.5v4.2c0 1.5 2.2 2.8 5 2.8s5-1.3 5-2.8v-4.2" />
    <path d="M20.5 8.5v5" />
  </Icon>
);

export const IconParent = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="7.5" r="3" />
    <path d="M3.8 19.5a5.2 5.2 0 0 1 10.4 0" />
    <circle cx="17" cy="11" r="2.2" />
    <path d="M14.2 19.5a3 3 0 0 1 5.9-.7" />
  </Icon>
);

export const IconPlay = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M11 9.5l3.5 2.5L11 14.5v-5Z" />
  </Icon>
);

export const IconKey = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="12" r="3.5" />
    <path d="M11.5 12H20M17 12v3M14.5 12v2.2" />
  </Icon>
);

export const IconArchive = (p) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="4" rx="1.4" />
    <path d="M5 9v8.5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5V9" />
    <path d="M10 12.5h4" />
  </Icon>
);

export const IconCheck = (p) => (
  <Icon {...p}>
    <path d="M5 12.5 9.5 17 19 7.5" />
  </Icon>
);

export const IconAlert = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 8v4.5M12 15.8v.2" />
  </Icon>
);

export const IconRefresh = (p) => (
  <Icon {...p}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.6-5.7" />
    <path d="M19.8 5v4h-4" />
  </Icon>
);

export const IconSettings = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
  </Icon>
);

export const IconGlobe = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M3.8 12h16.4" />
    <path d="M12 3.8c2 2.2 3 5 3 8.2s-1 6-3 8.2c-2-2.2-3-5-3-8.2s1-6 3-8.2Z" />
  </Icon>
);

/** Small inline spinner, used wherever an AI call is in flight. */
export function Spinner({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.2" fill="none" opacity="0.2" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
