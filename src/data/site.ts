export const PHONE_DISPLAY = "+971 50 000 0000";
export const PHONE_TEL = "tel:+971500000000";
export const EMAIL = "info@instabizweb.com";
export const WA_LINK =
  "https://wa.me/919898124987?text=Hi%20Insta%20Biz%20Web%2C%20I'd%20like%20to%20discuss%20a%20project.";
export const ADDRESS = "Downtown Dubai, United Arab Emirates";
export const SOCIAL = [
  { label: "Instagram", href: "https://www.instabizweb.com/" },
  { label: "TikTok", href: "https://www.instabizweb.com/" },
  { label: "Facebook", href: "https://www.instabizweb.com/" },
];
export const NAV = [
  { to: "/", label: "Home" },
  { to: "/puppies", label: "Puppies" },
  { to: "/happy-families", label: "Happy families" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Visit & contact" },
];
export const FOOTER_EXPLORE = [
  { to: "/puppies", label: "Available puppies" },
  { to: "/gone-home", label: "Gone home" },
  { to: "/happy-families", label: "Happy families" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/how-it-works#delivery", label: "Delivery & collection" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Visit & contact" },
];
export const waFor = (text: string) =>
  `https://wa.me/919898124987?text=${encodeURIComponent(text)}`;
