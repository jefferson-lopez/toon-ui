import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  FileCode2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { LandingDemo } from '@/components/landing-demo';
import { Button } from '@/components/ui/button';
import { repoUrl } from '@/lib/shared';

const benefits = [
  {
    title: 'Clearer AI output',
    description:
      'Instead of hoping the model writes ad-hoc React or vague JSON, you give it a focused UI language made for chat experiences.',
    icon: Wand2,
  },
  {
    title: 'Your app keeps control',
    description:
      'ToonUI does not execute tools, mutate data, or decide business rules. Your app stays in charge of actions, APIs, auth, and side effects.',
    icon: ShieldCheck,
  },
  {
    title: 'Better user experience',
    description:
      'The model can present cards, choices, forms, and next steps that are easier to use than raw text alone.',
    icon: Sparkles,
  },
  {
    title: 'Safer than generated React',
    description:
      'The model describes interface intent. Your renderer, components, and validation layer decide how that intent becomes UI.',
    icon: Code2,
  },
];

const comparisons = [
  {
    title: 'ToonUI',
    summary: 'A simple UI language for AI responses.',
    bullets: [
      'Best when the model should describe UI, not own your frontend',
      'Typed interaction payloads for reply and submit actions',
      'Works well when you want predictable UI inside chat',
    ],
  },
  {
    title: 'Generate React with AI',
    summary: 'Flexible, but easy to over-couple generation and product logic.',
    bullets: [
      'The model may produce code your app should not trust directly',
      'Harder to keep design system, safety, and behavior boundaries clean',
      'Useful for scaffolding, not ideal as a runtime UI protocol',
    ],
  },
  {
    title: 'Generate raw JSON',
    summary: 'Structured, but often too low-level for real UI conversations.',
    bullets: [
      'Usually needs custom schemas, parsers, and rendering conventions',
      'Can become verbose and hard to teach in prompts',
      'Good for machine contracts, weaker as a human-friendly UI language',
    ],
  },
];

const useCases = [
  'Product search panels inside chat',
  'Approval flows with clear next actions',
  'Forms the user can complete without leaving the conversation',
  'Decision support UI where the model explains and the user chooses',
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-10 md:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-tight text-foreground">
          Toon<span className="text-primary">UI</span>
        </Link>
      </header>

      <section className="space-y-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center space-y-6 text-center">
          <span className="inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            UI language for AI products
          </span>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Give your AI a <span className="text-primary">simple UI language</span>, not control of your app.
            </h1>

            <p className="mx-auto max-w-3xl text-base text-muted-foreground md:text-lg">
              ToonUI lets an LLM describe helpful interface blocks inside a conversation—cards,
              forms, buttons, choices, summaries—while your application keeps ownership of tools,
              permissions, API calls, persistence, and business rules.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/docs">
                Read the docs
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={repoUrl} target="_blank" rel="noreferrer">
                View repository
              </Link>
            </Button>
          </div>
        </div>

        <LandingDemo />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {benefits.map(({ title, description, icon: Icon }) => (
          <article key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 inline-flex rounded-lg border p-2 text-primary">
              <Icon className="size-4" />
            </div>
            <h2 className="mb-2 font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 className="size-4" />
            Best fit
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Use ToonUI when your AI should guide the experience, not run the application.</h2>
          <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
            {useCases.map((useCase) => (
              <li key={useCase} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-primary">
            <FileCode2 className="size-4" />
            Where ToonUI fits
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {comparisons.map((item) => (
              <div key={item.title} className="rounded-2xl border bg-background p-4">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
