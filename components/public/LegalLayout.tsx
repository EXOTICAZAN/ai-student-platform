import PageHero from "@/components/public/PageHero";

export interface LegalBlock {
  type: "p" | "ul" | "note";
  text?: string;
  items?: string[];
}

export interface LegalSection {
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export default function LegalLayout({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: LegalLayoutProps) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={intro} />
      <div className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                On this page
              </p>
              <nav className="mt-4 space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {section.heading}
                  </a>
                ))}
              </nav>
              <p className="mt-5 border-t border-white/[0.08] pt-4 text-xs text-slate-500">
                Last updated: {updated}
              </p>
            </div>
          </aside>

          <article className="max-w-3xl">
            <p className="mb-10 text-sm text-slate-500 lg:hidden">
              Last updated: {updated}
            </p>
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-12 scroll-mt-28">
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.blocks.map((block, i) => {
                    if (block.type === "ul") {
                      return (
                        <ul key={i} className="ml-5 list-disc space-y-2">
                          {block.items?.map((item, j) => (
                            <li key={j} className="leading-relaxed text-slate-400">
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    if (block.type === "note") {
                      return (
                        <p
                          key={i}
                          className="rounded-xl border-l-4 border-indigo-500 bg-indigo-500/[0.08] px-4 py-3 text-sm leading-relaxed text-slate-300"
                        >
                          {block.text}
                        </p>
                      );
                    }
                    return (
                      <p key={i} className="leading-relaxed text-slate-400">
                        {block.text}
                      </p>
                    );
                  })}
                </div>
              </section>
            ))}
          </article>
        </div>
      </div>
    </>
  );
}
