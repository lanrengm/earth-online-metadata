import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 文章集合：src/content/articles/ 下每个 .mdx = 一篇文章，frontmatter 定义元信息
const articles = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
