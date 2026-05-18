import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsBody, DocsPage, DocsTitle, DocsDescription, ViewOptionsPopover } from 'fumadocs-ui/layouts/docs/page';
import { getMDXComponents } from '@/components/mdx';
import { repoBlobUrl } from '@/lib/shared';
import { source } from '@/lib/source';
export function generateStaticParams() { return source.generateParams(); }
export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> { const { slug = [] } = await params; const page = source.getPage(slug); return page ? { title: page.data.title, description: page.data.description } : {}; }
export default async function DocPage({ params }: { params: Promise<{ slug?: string[] }> }) { const { slug = [] } = await params; const page = source.getPage(slug); if (!page) notFound(); const MDX = page.data.body; const githubUrl = `${repoBlobUrl}/apps/web/content/docs/${page.path}`; return <DocsPage toc={page.data.toc} tableOfContent={{ enabled: true }}><div className="mb-6 flex items-start justify-between gap-4"><div>{page.data.title ? <DocsTitle>{page.data.title}</DocsTitle> : null}{page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}</div><ViewOptionsPopover githubUrl={githubUrl} /></div><DocsBody><MDX components={getMDXComponents()} /></DocsBody></DocsPage>; }
