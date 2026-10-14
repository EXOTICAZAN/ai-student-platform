interface ArticleSection {
  heading: string;
  paragraphs: string[];
}

export default function ArticleBody({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            {section.heading}
          </h2>
          <div className="mt-4 space-y-4">
            {section.paragraphs.map((paragraph, i) => (
              <p key={i} className="leading-relaxed text-slate-400">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
