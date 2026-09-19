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
    // 列表条目配图（静态截图放 public/ 下，填根路径如 /images/articles/xxx.png）；缺省时列表显示品牌色块占位
    image: z.string().optional(),
  }),
});

export const collections = { articles };
