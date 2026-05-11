export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <Header />
      <Hero />
      <Features />
      <CallToAction />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="bg-olive-dark text-sand border-b-4 border-khaki">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
        <Wordmark />
        <nav className="hidden md:flex gap-8 font-heading uppercase text-sm tracking-wider">
          <a href="#features" className="hover:text-khaki transition-colors">
            Features
          </a>
          <a href="#quote" className="hover:text-khaki transition-colors">
            Quick Quote
          </a>
          <a href="#contact" className="hover:text-khaki transition-colors">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}

function Wordmark() {
  return (
    <div className="flex items-baseline gap-3 font-display text-xl md:text-2xl">
      <span>MOVING</span>
      <span className="text-khaki text-base md:text-lg tracking-widest">
        ★★★
      </span>
      <span>COMMANDER</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative bg-olive text-sand">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.05) 20px, rgba(255,255,255,0.05) 40px)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="font-heading uppercase tracking-[0.3em] text-khaki text-sm mb-4">
          The Complete Moving Company Management Solution
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-tight mb-6">
          COMMAND
          <br />
          THE MOVE.
        </h1>
        <p className="max-w-xl text-lg md:text-xl text-sand/90 mb-10">
          Quotes, jobs, crews, invoicing — one system, built by movers, for
          movers. From a single Quick Quote to a full back office.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#quote"
            className="inline-flex items-center justify-center bg-khaki text-olive-dark font-heading uppercase tracking-wider px-8 py-4 hover:bg-khaki-dark hover:text-sand transition-colors"
          >
            Get a Quick Quote
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center border-2 border-sand text-sand font-heading uppercase tracking-wider px-8 py-4 hover:bg-sand hover:text-olive-dark transition-colors"
          >
            See What It Does
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: "Quick Quote",
      body: "Public-facing instant quote form. Customers get a number; you get a lead.",
    },
    {
      title: "Jobs & Dispatch",
      body: "Schedule crews, vehicles, and equipment. Local and long-haul.",
    },
    {
      title: "Invoicing & Payments",
      body: "Bill the way the tariff (or your discount sheet) says to bill.",
    },
    {
      title: "Storage / SIT",
      body: "Track customers in storage, bill per pound per day, never lose a box.",
    },
    {
      title: "Crew & Payroll",
      body: "Time on the truck, commissions, the hard part — handled.",
    },
    {
      title: "Reporting & GL",
      body: "Real numbers on the business, not a guess at month-end.",
    },
  ];

  return (
    <section id="features" className="bg-sand py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="font-heading uppercase tracking-[0.3em] text-olive text-sm mb-3">
          Field Manual
        </p>
        <h2 className="font-display text-3xl md:text-5xl text-ink mb-12">
          BUILT FOR THE WHOLE OPERATION
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-olive-light/30">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-sand p-8 hover:bg-white transition-colors"
            >
              <h3 className="font-heading uppercase text-xl text-olive-dark mb-3 tracking-wide">
                {f.title}
              </h3>
              <p className="text-ink/80">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section id="quote" className="bg-olive-dark text-sand py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="font-heading uppercase tracking-[0.3em] text-khaki text-sm mb-3">
          Coming Soon
        </p>
        <h2 className="font-display text-3xl md:text-5xl mb-6">
          THE QUICK QUOTE PAGE
        </h2>
        <p className="text-lg text-sand/90 mb-8 max-w-2xl mx-auto">
          A public, no-login quote tool — the first thing customers will see.
          Enter origin, destination, weight, and get a real number based on
          your rate sheet.
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
      className="bg-ink text-sand/70 py-8 text-sm font-heading uppercase tracking-wider"
    >
      <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <span>Moving Commander</span>
        <span className="text-sand/40">Sample site — Railway preview</span>
      </div>
    </footer>
  );
}
