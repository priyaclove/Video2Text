import {
  AutoAwesomeIcon,
  PdfFileIcon,
  ScreenshotRegionIcon,
  VisibilityIcon,
} from "./components/icons";
import { UrlGenerator } from "./components/UrlGenerator";
import { APP_NAME } from "./lib/branding";

export default function Home() {
  return (
    <>
      <TopNav />
      <main className="pt-32 pb-20 px-4 md:px-10 max-w-[1200px] mx-auto w-full">
        <Hero />
        <FeatureBento />
        <CallToAction />
      </main>
      <SiteFooter />
    </>
  );
}

function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="flex justify-between items-center px-4 md:px-10 py-4 max-w-[1200px] mx-auto">
        <span className="text-2xl font-bold tracking-tight text-on-surface">
          {APP_NAME}
        </span>
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#"
            className="text-base text-primary font-semibold border-b-2 border-primary pb-1 transition-all"
          >
            Product
          </a>
          <a
            href="#features"
            className="text-base text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Features
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="flex flex-col items-center text-center mb-8">
      <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container-high border border-white/10 mb-6">
        <span className="font-mono text-xs text-primary uppercase tracking-widest">
          AI-Powered Documentation Generator
        </span>
      </div>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight md:tracking-tighter max-w-3xl mb-6 leading-tight">
        Transform YouTube installation videos into professional{" "}
        <span className="text-primary">step-by-step documentation</span> using
        AI.
      </h1>
      <p className="text-base text-on-surface-variant max-w-2xl mb-12">
        Stop pausing and rewinding. Let our AI watch the tutorial, extract
        high-resolution frames, and draft structured technical guides in
        seconds.
      </p>

      <UrlGenerator />
    </section>
  );
}

function FeatureBento() {
  return (
    <section id="features" className="mt-32">
      <div className="text-center mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">
          Engineered for Technical Accuracy
        </h2>
        <p className="text-base text-on-surface-variant">
          The power of LLMs combined with computer vision.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 glass-card rounded-2xl overflow-hidden group">
          <div className="p-8 h-full flex flex-col">
            <div className="mb-auto">
              <VisibilityIcon className="w-9 h-9 text-primary mb-4" />
              <h3 className="text-2xl font-semibold tracking-tight mb-2">
                AI Video Understanding
              </h3>
              <p className="text-base text-on-surface-variant max-w-md">
                Our neural network analyzes every frame to distinguish between
                fluff and critical installation steps, ensuring zero-noise
                documentation.
              </p>
            </div>
            <div className="mt-8 rounded-xl overflow-hidden border border-white/5 bg-surface-container h-48 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(194,193,255,0.25),transparent_50%)]" />
              <svg
                aria-hidden="true"
                className="absolute inset-0 w-full h-full opacity-50"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,100 Q50,40 100,100 T200,100 T300,100 T400,100"
                  stroke="rgb(194,193,255)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M0,120 Q50,80 100,120 T200,120 T300,120 T400,120"
                  stroke="rgb(173,198,255)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 glass-card rounded-2xl p-8 group">
          <ScreenshotRegionIcon className="w-9 h-9 text-secondary mb-4" />
          <h3 className="text-2xl font-semibold tracking-tight mb-2">
            Smart Screenshot Detection
          </h3>
          <p className="text-base text-on-surface-variant">
            Automatically captures the exact moment a command is typed or a
            screw is turned, perfectly cropped and enhanced.
          </p>
        </div>

        <div className="md:col-span-4 glass-card rounded-2xl p-8 group">
          <AutoAwesomeIcon className="w-9 h-9 text-tertiary mb-4" />
          <h3 className="text-2xl font-semibold tracking-tight mb-2">
            Auto Documentation
          </h3>
          <p className="text-base text-on-surface-variant">
            Generates logical headings, code blocks, and safety warnings based
            on audio cues and visual context.
          </p>
        </div>

        <div className="md:col-span-8 glass-card rounded-2xl overflow-hidden group">
          <div className="p-8 h-full flex flex-col">
            <div className="mb-auto">
              <PdfFileIcon className="w-9 h-9 text-primary mb-4" />
              <h3 className="text-2xl font-semibold tracking-tight mb-2">
                PDF & DOCX Export
              </h3>
              <p className="text-base text-on-surface-variant max-w-md">
                Format your guides into clean, branded PDFs or editable DOCX
                files ready for internal distribution or customer support.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <ExportTile label="EXPORT_FORMAT_V1" accent="primary" />
              <ExportTile label="DOCUMENT_LAYOUT_02" accent="secondary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExportTile({
  label,
  accent,
}: {
  label: string;
  accent: "primary" | "secondary";
}) {
  const bar =
    accent === "primary" ? "bg-primary/20" : "bg-secondary/20";
  return (
    <div className="h-32 bg-surface-container-low rounded-lg border border-white/5 p-4 flex flex-col justify-end">
      <span className="font-mono text-xs tracking-wider text-on-surface-variant">
        {label}
      </span>
      <div className={`w-full h-1 ${bar} rounded mt-2`} />
    </div>
  );
}

function CallToAction() {
  return (
    <section className="mt-32 glass-card rounded-3xl p-12 text-center border border-white/5 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      <h2 className="relative text-3xl md:text-4xl font-bold tracking-tight mb-6">
        Ready to automate your technical writing?
      </h2>
      <p className="relative text-base text-on-surface-variant mb-10 max-w-xl mx-auto">
        Join 2,000+ developers and engineers who have stopped manual
        documentation and started using {APP_NAME}.
      </p>
      <div className="relative flex flex-col sm:flex-row justify-center gap-4">
        <button className="bg-on-surface text-background px-10 py-4 rounded-xl font-bold hover:bg-white transition-colors">
          Start Free Trial
        </button>
        <button className="border border-white/10 text-on-surface px-10 py-4 rounded-xl font-bold hover:bg-white/5 transition-colors">
          Book a Demo
        </button>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="w-full py-8 border-t border-white/5 bg-background mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-10 max-w-[1200px] mx-auto gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-2xl font-bold text-on-surface">{APP_NAME}</span>
          <p className="text-sm text-on-tertiary-container opacity-80 hover:opacity-100 transition-opacity">
            © {new Date().getFullYear()} {APP_NAME}. Precision engineered
            intelligence.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          <a
            href="#"
            className="text-sm text-on-tertiary-container hover:text-primary transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-sm text-on-tertiary-container hover:text-primary transition-colors"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-sm text-on-tertiary-container hover:text-primary transition-colors"
          >
            Contact
          </a>
          <a
            href="#"
            className="text-sm text-on-tertiary-container hover:text-primary transition-colors"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
