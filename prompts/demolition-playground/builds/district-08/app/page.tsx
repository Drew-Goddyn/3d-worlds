import type { Metadata } from "next";
import { DemolitionPlayground } from "./playground/DemolitionPlayground";

export const metadata: Metadata = {
  title: "District 08 — Demolition Rewind",
  description:
    "Swing the wrecking ball, wire the charges, drop a downtown block, and rewind every last brick.",
};

export default function Home() {
  return <DemolitionPlayground />;
}
