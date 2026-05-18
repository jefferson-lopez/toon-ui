import { BookOpenText, Boxes, Github, Package } from 'lucide-react';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { appName, repoUrl } from '@/lib/shared';
export function baseOptions(): BaseLayoutProps {
  return {
    nav: { title: appName, url: '/' },
    githubUrl: repoUrl,
    links: [
      { icon: <BookOpenText className="size-4" />, text: 'Docs', url: '/docs', active: 'nested-url' },
      { icon: <Package className="size-4" />, text: 'Packages', url: '/docs/packages/core', active: 'nested-url' },
      { icon: <Boxes className="size-4" />, text: 'Language', url: '/docs/language/catalog', active: 'nested-url' },
      { type: 'icon', label: 'GitHub repository', icon: <Github className="size-4" />, text: 'GitHub', url: repoUrl }
    ]
  };
}
