export const metadata = {
  title: "Nigeria LGA Map",
  description: "Interactive map of all 774 Local Government Areas in Nigeria with project tracking and FAAC allocation data.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  // Map page manages its own full-screen layout — no global nav/footer
  return <>{children}</>;
}
