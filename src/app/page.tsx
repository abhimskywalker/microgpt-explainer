"use client";

import { useState } from "react";
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
import { GuidedMode } from "./components/GuidedMode";

export default function Home() {
  const [guidedEnabled, setGuidedEnabled] = useState(false);

  return (
    <div 
      className="grain-overlay min-h-screen"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <ThemeSwitcher />
      <GuidedMode enabled={guidedEnabled} onEnabledChange={setGuidedEnabled} />
      <TableOfContents hidden={guidedEnabled} />
      <main className="relative pb-28 md:pb-24">
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
