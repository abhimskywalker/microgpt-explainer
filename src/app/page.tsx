import { HeroSection } from "./components/HeroSection";
import { DataSection } from "./components/DataSection";
import { AutogradSection } from "./components/AutogradSection";
import { ParametersSection } from "./components/ParametersSection";
import { ArchitectureSection } from "./components/ArchitectureSection";
import { TrainingSection } from "./components/TrainingSection";
import { InferenceSection } from "./components/InferenceSection";
import { FullCodeSection } from "./components/FullCodeSection";
import { TableOfContents } from "./components/TableOfContents";

export default function Home() {
  return (
    <div className="grain-overlay bg-stone-950 text-amber-50">
      <TableOfContents />
      <main className="relative">
        <HeroSection />
        <DataSection />
        <AutogradSection />
        <ParametersSection />
        <ArchitectureSection />
        <TrainingSection />
        <InferenceSection />
        <FullCodeSection />
      </main>
    </div>
  );
}
