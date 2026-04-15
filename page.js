'use client';
import { useState, useRef } from 'react';
import LandingPage from '../components/LandingPage';
import ToolSection from '../components/ToolSection';

export default function Home() {
  return (
    <main>
      <LandingPage />
      <ToolSection />
    </main>
  );
}
