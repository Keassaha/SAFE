import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Instrument_Serif } from "next/font/google";

export const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

// A appliquer sur <html> pour exposer les variables CSS des polices.
export const fontVariables = `${GeistSans.variable} ${GeistMono.variable} ${instrumentSerif.variable}`;
