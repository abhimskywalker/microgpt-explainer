import { HeroSection } from "./components/HeroSection";
import { DataSection } from "./components/DataSection";
import { AutogradSection } from "./components/AutogradSection";
import { ParametersSection } from "./components/ParametersSection";
import { ArchitectureSection } from "./components/ArchitectureSection";
import { TrainingSection } from "./components/TrainingSection";
import { InferenceSection } from "./components/InferenceSection";
import { FullCodeSection } from "./components/FullCodeSection";
import { TableOfContents } from "./components/TableOfContents";
import { ThemeSwitcher } from "./components/ThemeSwitcher";

export default function Home() {
  return (
    <div 
      className="grain-overlay min-h-screen"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <ThemeSwitcher />
      <TableOfContents />
      <main className="relative">
        <HeroSection />
        <div className="section-divider" />
        <DataSection />
        <div className="section-divider" />
        <AutogradSection />
        <div className="section-divider" />
        <ParametersSection />
        <div className="section-divider" />
        <ArchitectureSection />
        <div className="section-divider" />
        <TrainingSection />
        <div className="section-divider" />
        <InferenceSection />
        <div className="section-divider" />
        <FullCodeSection />
      </main>
    </div>
  );
}
