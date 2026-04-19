import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Layers, Globe, Box, Code2, Shield, X } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    id: 'surgical',
    title: 'Surgical Extraction',
    icon: <Zap size={24} />,
    short: 'Capture specific asset types while ignoring analytics.',
    full: 'Our engine is fine-tuned to distinguish between core assets and third-party trackers. You can precisely toggle between GLTF models, WASM modules, and custom font subsets, ensuring your local copy is clean, lightweight, and focused on what matters—the design and logic.'
  },
  {
    id: 'structure',
    title: 'Structure Preservation',
    icon: <Layers size={24} />,
    short: 'We maintain exact folder hierarchies for easy integration.',
    full: 'PixelPack reconstructs the original directory tree as it exists on the server. Whether it is nested /assets/css folders or dynamically resolved static paths, our intelligent path rewriter ensures all references remain intact, allowing you to run the site locally without a single manual edit.'
  },
  {
    id: 'fidelity',
    title: 'Offline Fidelity',
    icon: <Shield size={24} />,
    short: 'Perfect for mirrors, audits, or performance analysis.',
    full: 'Create pixel-perfect offline mirrors of any public web experience. This is an indispensable tool for security audits, forensic analysis, or deep-diving into the performance architecture of state-of-the-art web applications without the noise of live network conditions.'
  }
];

const InfoSections = () => {
  const sectionsRef = useRef([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (selectedId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedId]);

  useEffect(() => {
    // Standard entrance animations
    sectionsRef.current.forEach((section) => {
      if (!section || section.classList.contains('story-section')) return;
      gsap.fromTo(
        section.querySelector('.section-content'),
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    });

    // Scroll-Driven Story Reveal (Scrubbing)
    const storySection = document.querySelector('.story-section');
    if (storySection) {
      const steps = storySection.querySelectorAll('.story-step');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: storySection,
          start: 'top 40%',
          end: 'bottom 40%',
          scrub: 1,
          // pin: true, // Optional: pin the section while scrolling through steps
        }
      });

      tl.fromTo('#timeline-progress', { scaleY: 0 }, { scaleY: 1, ease: 'none' }, 0);

      steps.forEach((step, i) => {
        tl.fromTo(
          step,
          { opacity: 0.2, x: i % 2 === 0 ? -30 : 30 },
          { opacity: 1, x: 0, ease: 'power2.out' },
          i * 0.3
        );
      });
    }
  }, []);

  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  const selectedFeature = FEATURES.find(f => f.id === selectedId);

  return (
    <div className="info-container">
      {/* ─── Project Detail ─── */}
      <section className="info-section" ref={addToRefs}>
        <div className="section-content">
          <div className="section-icon"><Zap size={32} /></div>
          <h2 className="section-title">The PixelPack Vision</h2>
          <p className="section-text">
            In an era where web experiences are increasingly ephemeral, PixelPack stands as a 
            bridge between the cloud and your local environment. We've engineered a sophisticated 
            extraction engine that doesn't just "copy" files—it reconstructs the entire frontend 
            ecosystem of a website, ensuring that every interaction, animation, and visual nuance 
            is preserved with surgical precision.
          </p>
        </div>
      </section>

      {/* ─── How it Works (Scroll-Driven Story Reveal) ─── */}
      <section className="info-section story-section" ref={addToRefs}>
        <div className="section-content story-content">
          <div className="section-icon"><Cpu size={32} /></div>
          <h2 className="section-title">The Engineering Pipeline</h2>
          
          <div className="story-timeline-container">
            <div className="story-line">
              <div className="story-line-progress" id="timeline-progress"></div>
            </div>

            <div className="work-steps story-steps">
              <div className="step story-step">
                <div className="step-num">01</div>
                <div className="step-content">
                  <h3>Intelligent Discovery</h3>
                  <p>Our Puppeteer-driven crawler executes JavaScript in a headless Chrome instance, discovering dynamic routes that traditional scrapers miss.</p>
                </div>
              </div>
              <div className="step story-step">
                <div className="step-num">02</div>
                <div className="step-content">
                  <h3>Asset Normalization</h3>
                  <p>We intercept network requests to capture assets in their raw state, automatically rewriting relative paths to ensure local compatibility.</p>
                </div>
              </div>
              <div className="step story-step">
                <div className="step-num">03</div>
                <div className="step-content">
                  <h3>Atomic Packaging</h3>
                  <p>A multi-threaded archiving process bundles thousands of assets into a structured ZIP, ready for instant offline deployment or audit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why PixelPack? (With Glass Morph) ─── */}
      <section className="info-section" ref={addToRefs}>
        <div className="section-content">
          <div className="section-icon"><Shield size={32} /></div>
          <h2 className="section-title">Why Developers Choose Us</h2>
          <div className="features-grid">
            {FEATURES.map((feature) => (
              <motion.div
                layoutId={feature.id}
                key={feature.id}
                className="feature-card"
                onClick={() => setSelectedId(feature.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.h3 layoutId={`title-${feature.id}`}>{feature.title}</motion.h3>
                <motion.p layoutId={`short-${feature.id}`}>{feature.short}</motion.p>
                <div className="feature-hint">Click to expand →</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedId && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              layoutId={selectedId}
              className="expanded-card"
            >
              <button className="modal-close" onClick={() => setSelectedId(null)}>
                <X size={20} />
              </button>
              <div className="expanded-content">
                <motion.div className="expanded-icon" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                  {selectedFeature?.icon}
                </motion.div>
                <motion.h2 layoutId={`title-${selectedId}`}>{selectedFeature?.title}</motion.h2>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="expanded-body"
                >
                  <p>{selectedFeature?.full}</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Tech Stack ─── */}
      <section className="info-section" ref={addToRefs}>
        <div className="section-content">
          <div className="section-icon"><Layers size={32} /></div>
          <h2 className="section-title">The Modern Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <Code2 size={24} />
              <div className="tech-info">
                <strong>React 18</strong>
                <span>Declarative UI with Fiber-based rendering.</span>
              </div>
            </div>
            <div className="tech-item">
              <Globe size={24} />
              <div className="tech-info">
                <strong>Puppeteer</strong>
                <span>High-fidelity headless browser automation.</span>
              </div>
            </div>
            <div className="tech-item">
              <Box size={24} />
              <div className="tech-info">
                <strong>Three.js</strong>
                <span>Immersive 3D environments and GPU-accelerated visuals.</span>
              </div>
            </div>
            <div className="tech-item">
              <Zap size={24} />
              <div className="tech-info">
                <strong>GSAP</strong>
                <span>The industry standard for high-performance web animations.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

  );
};

export default InfoSections;
