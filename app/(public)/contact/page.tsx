import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, HelpCircle, Mail, ShieldAlert } from "lucide-react";
import PageHero from "@/components/public/PageHero";
import AnimatedSection from "@/components/public/AnimatedSection";
import ContactForm from "@/components/public/ContactForm";

export const metadata: Metadata = {
  title: "Contact — EduForge AI",
  description:
    "Get in touch with the EduForge AI team for product support, feedback, partnerships or press enquiries.",
};

const CHANNELS = [
  {
    icon: Mail,
    label: "General & support",
    value: "azanalikhadim02@gmail.com",
    href: "mailto:azanalikhadim02@gmail.com",
    note: "Product questions, bugs, feedback and anything that does not fit below.",
  },
  {
    icon: ShieldAlert,
    label: "Security disclosure",
    value: "azanalikhadim02@gmail.com",
    href: "mailto:azanalikhadim02@gmail.com",
    note: "Please use this address for vulnerabilities so we can act on them quickly.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to"
        titleAccent="a human"
        description="Questions, feedback, bug reports, partnerships or press — this reaches the people actually building EduForge AI."
      />

      <div className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <AnimatedSection>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-white">Send a message</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Send your message through our support inbox. We will reply by email; for attachments
                or a security disclosure, you can use the fallback email option after submitting.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </AnimatedSection>

          <div className="space-y-4">
            {CHANNELS.map(({ icon: Icon, label, value, href, note }, i) => (
              <AnimatedSection key={value} delay={0.05 + i * 0.05}>
                <a
                  href={href}
                  className="group block rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-colors hover:border-indigo-500/40 hover:bg-white/[0.05]"
                >
                  <Icon className="h-5 w-5 text-indigo-400 transition-transform group-hover:scale-110" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-white group-hover:text-indigo-300">
                    {value}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{note}</p>
                </a>
              </AnimatedSection>
            ))}

            <AnimatedSection delay={0.15}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <Clock3 className="h-5 w-5 text-indigo-400" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Response time
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Usually within two business days. We are a small team, so security disclosures and
                  anything blocking your studies come first.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <HelpCircle className="h-5 w-5 text-indigo-400" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Looking for an answer?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  The help centre covers most product questions and may save you the wait.
                </p>
                <Link
                  href="/help"
                  className="mt-3 inline-flex text-sm font-medium text-indigo-300 transition-colors hover:text-white"
                >
                  Browse the help centre →
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </>
  );
}
