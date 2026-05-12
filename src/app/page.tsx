export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <BrandBar />
      <NavStrip />
      <HeroImage />
      <Headline />
      <Features />
      <CallToAction />
      <Footer />
    </div>
  );
}

function BrandBar() {
  return (
    <header className="bg-olive text-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center">
        <Wordmark />
        <p className="font-body italic text-sand mt-2 text-base md:text-lg">
          The Complete Moving Company Management Solution
        </p>
        <p className="font-display text-2xl md:text-4xl mt-6">
          Call For A FREE Demo:
          <br />
          <a
            href="tel:+14699230350"
            className="underline decoration-2 underline-offset-4 hover:text-khaki transition-colors"
          >
            469-923-0350
          </a>
        </p>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center justify-center gap-3 md:gap-5 font-display text-3xl md:text-5xl tracking-wide">
      <span>MOVING</span>
      <span className="text-khaki text-2xl md:text-3xl tracking-widest">
        ★★★
      </span>
      <span>COMMANDER</span>
    </div>
  );
}

function NavStrip() {
  return (
    <nav className="bg-khaki">
      <div className="mx-auto max-w-6xl px-6 py-4 flex justify-around items-center font-heading uppercase text-ink tracking-[0.3em] text-sm md:text-base">
        <a href="#top" className="hover:text-olive transition-colors">
          Home
        </a>
        <a href="#features" className="hover:text-olive transition-colors">
          About
        </a>
        <a href="#contact" className="hover:text-olive transition-colors">
          Contact
        </a>
      </div>
    </nav>
  );
}

function HeroImage() {
  return (
    <section
      className="relative h-64 md:h-96 bg-olive-dark overflow-hidden"
      aria-label="Hero"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(245,197,24,0.08) 0 2px, transparent 2px 24px)",
        }}
      />
      <div className="relative h-full flex items-center justify-center text-center px-6">
        <div>
          <p className="font-heading uppercase tracking-[0.4em] text-khaki text-xs md:text-sm mb-3">
            Trusted by movers
          </p>
          <p className="font-display text-white text-2xl md:text-4xl">
            From the first quote to the final invoice.
          </p>
        </div>
      </div>
    </section>
  );
}

function Headline() {
  return (
    <section className="bg-sand py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h1 className="font-display text-3xl md:text-5xl text-ink leading-tight">
          The Compliant, Time-saving, Total Moving Management Solution for
          Movers
        </h1>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "Lead Management & Email Marketing",
      body: "Capture leads, nurture them, convert them — without paying a SaaS for every step.",
    },
    {
      title: "On-site Customer Contract & Payment",
      body: "Sign and bill on the truck. Cards, ACH, signed in the driveway.",
    },
    {
      title: "Compliant Documents & Mobile Job Sheets",
      body: "BOLs, inventories, and tariffs — always current, always on the tablet.",
    },
    {
      title: "Dispatch, GPS & Crew Management",
      body: "Know where every truck is, who's on it, and how the day is running.",
    },
    {
      title: "Quoting & Storage / SIT",
      body: "Local hourly, long-haul by weight, storage by the day — all in one system.",
    },
    {
      title: "Reporting, Payroll & Accounting",
      body: "Real numbers on the business — month-end isn't a guessing game.",
    },
  ];

  return (
    <section id="features" className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-heading uppercase tracking-[0.3em] text-olive text-sm mb-3 text-center">
          What It Does
        </p>
        <h2 className="font-display text-2xl md:text-4xl text-ink mb-12 text-center">
          BUILT FOR THE WHOLE OPERATION
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="border-2 border-olive/10 bg-sand/40 p-6 hover:border-khaki hover:bg-sand transition-colors"
            >
              <h3 className="font-heading uppercase text-lg text-olive mb-3 tracking-wide">
                {f.title}
              </h3>
              <p className="text-ink/80 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="bg-olive text-white py-16">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="font-heading uppercase tracking-[0.3em] text-khaki text-sm mb-3">
          Coming Soon
        </p>
        <h2 className="font-display text-2xl md:text-4xl mb-6">
          THE QUICK QUOTE PAGE
        </h2>
        <p className="text-base md:text-lg text-sand mb-8 max-w-2xl mx-auto">
          A public, no-login quote tool. Enter origin, destination, weight —
          get a real number based on your rate sheet.
        </p>
        <span className="inline-block border-2 border-khaki text-khaki font-heading uppercase tracking-wider px-8 py-4">
          In Development
        </span>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      id="contact"
      className="bg-olive-dark text-sand/70 py-6 text-sm font-heading uppercase tracking-wider"
    >
      <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-3">
        <span>Moving Commander</span>
        <a href="tel:+14699230350" className="hover:text-khaki">
          469-923-0350
        </a>
        <span className="text-sand/40">Sample site — Railway preview</span>
      </div>
    </footer>
  );
}
