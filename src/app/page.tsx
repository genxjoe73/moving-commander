import Image from "next/image";

const slides = [
  ["/site-assets/customer-mover-mc-2019.jpg", "Customer and mover"],
  ["/site-assets/customermovermc-2.jpg", "Moving Commander customer service"],
  ["/site-assets/moversmc.jpg", "Professional movers"],
  ["/site-assets/truckmovingcommander-2.jpg", "Moving truck"],
  ["/site-assets/contract-signing.jpg", "Digital contract signing"],
];

const features = [
  ["Easy Job Entry, Job Scheduling & Dispatch", "Like No Other"],
  ["Electronic Document Control for Customer, Driver & Home Office", "Desktop or Mobile Management"],
  ["Slashed Payroll Time with Built-In Paycheck Generation", "Gives Your Time Back To You — all a by-product of job scheduling and dispatch"],
  ["Built-In, Full Featured Accounting", "Customized for Your Moving Business. Job activity resides in a full-featured accounting system built-in to Moving Commander. No uploading data, no third-party interfacing or posting."],
  ["Compliant Paperless Contract and Payment", "USDOT and State Compliant Forms, On-site Contract Review, Approval, and Payment"],
  ["Personalized for Your Business", "Cherry-Pick Your Features"],
  ["Subscriber-Based System, Multi-User Access", "Run your entire moving business for a low monthly rate."],
  ["Easy to Learn & Super Efficient", "All key job information is available from a single page."],
  ["Agent Lead Management", "Mobile or Desktop Access"],
];

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <div className="header-brand">
          <a href="#top" aria-label="Moving Commander home">
            <Image src="/site-assets/logo-on-dark.svg" alt="Moving Commander, the complete moving company management solution" width={506} height={80} priority />
          </a>
        </div>
        <div className="phone-top">
          <p>Call For A FREE Demo:</p>
          <a href="tel:+14699230350">469-923-0350</a>
        </div>
        <nav aria-label="Primary navigation">
          <a href="#top">HOME</a>
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
      </header>

      <section className="hero" aria-label="Moving Commander introduction">
        <div className="hero-header">
          <p>Introducing...</p>
          <h1>The Only Total Moving Management Solution<br />That is State DMV Compliant</h1>
        </div>
        <div className="hero-slideshow">
          {slides.map(([src, alt], index) => (
            <Image key={src} src={src} alt={alt} fill priority={index === 0} sizes="100vw" className={`hero-slide hero-slide-${index}`} />
          ))}
        </div>
      </section>

      <section className="gallery" id="features">
        <h2>The Compliant, Time-saving, Total Moving Management Solution<br />for Movers</h2>
        <Image className="feature-diagram" src="/site-assets/feature-diagram-new.png" alt="Moving Commander feature diagram" width={800} height={665} />
        <div className="feature-grid">
          {features.map(([title, subtitle]) => (
            <article className="feature-card" key={title}>
              <h3>{title}</h3>
              <p>{subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="red-rule" />

      <section className="about" id="about">
        <h2>ABOUT OUR COMPANY</h2>
        <p>We believe a strong logical and practical approach can produce a winning formula for the moving industry. Moving Commander lowers cost of ownership to drive new business by helping you work smarter not harder.</p>
        <p>Two years of research and hands-on experience working with other so-called &quot;solutions&quot; for the management of a moving business shows proper processes and simple organization in the moving business was woefully lacking. We identified the key aspects of the moving business in accordance to State mandated rules and regulations, that led us to a better way — a solution to revolutionize the moving industry.</p>
        <p>Moving Commander addresses mission-critical pitfalls and mitigating risk in the moving business such as dispatching jobs, managing personnel, payment management, payroll, workflow, scheduling and more. It enhances the customer experience using the social media platform to increase marketing opportunities and brand awareness.</p>
        <p>Moving Commander is a 21st century, all-digital paperless system platform for the entire moving industry. The new platform eliminates piles of paperwork, is compliant with state law, and handles money transactions via a simple-to-use handheld digital tablet.</p>
        <p>The mobility factor of the tablet coupled with the correct software solution makes for huge time savings and seamless lead-to-payment processing. The results can produce exponential sales increases and profits by a factor of five in the first year.</p>
        <p>Moving Commander pays for itself in no time. Gone is the paper. Now digitally safe and secure processes produce the accuracy and speed a mover needs to compete and excel.</p>
      </section>

      <footer className="site-footer" id="contact">
        <Image src="/site-assets/logo-header-footer-2019.png" alt="Moving Commander" width={450} height={74} />
        <p className="footer-hero">Request a FREE Demo</p>
        <p className="footer-hero">Call: <a href="tel:+14699230350">469-923-0350</a></p>
        <a className="contact-link" href="mailto:info@movingcommander.com">Contact Us</a>
        <a href="https://www.mytexasmover.com/SMA/For_Consumers/Find_A_Mover.aspx?ScrollNum=0&Search=Moving%20Commander&Filter="><Image className="association-logo" src="/site-assets/southwest-movers-association.png" alt="Southwest Movers Association" width={200} height={94} /></a>
        <p>Don&apos;t Make A Move Without Us.<br />Find A Licensed Mover in Texas.</p>
        <a href="https://www.txdmv.gov/motorists/consumer-protection/dont-make-a-move"><Image src="/site-assets/stop-sign-100x100.png" alt="Texas Department of Motor Vehicles" width={100} height={100} /></a>
        <p>Texas Department of Motor Vehicles</p>
        <div className="copyright">©2020 - <strong>Moving Commander LLC</strong></div>
      </footer>
    </main>
  );
}
