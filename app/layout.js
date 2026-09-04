import "./globals.css";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const globalStyles = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

export const metadata = {
  title: "Routine",
  description: "Plan today. A better tomorrow.",
}; 
export default function RootLayout({ children }) {
  return <html lang="en"><head><style id="routine-global-styles" dangerouslySetInnerHTML={{ __html: globalStyles }} /></head><body>{children}</body></html>;
}
