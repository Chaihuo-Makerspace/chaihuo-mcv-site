import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    description: z.string(),
    image: z.string().url(),
    tags: z.array(z.string()),
    yuqueUrl: z.string().url().optional(),
  }),
});

const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.enum(['人物访谈', '纪录片', 'Vlog', '文章']),
    description: z.string(),
    readTime: z.string().optional(),
    coverImage: z.string().url().optional(),
    videoLinks: z.array(z.object({
      platform: z.string(),
      url: z.string(),
    })).default([]),
    pdfName: z.string().optional(),
  }),
});

const equipment = defineCollection({
  loader: file('./src/data/equipment.json'),
  schema: z.object({
    id: z.string(),
    icon: z.string(),
    title: z.string(),
    items: z.array(z.object({
      name: z.string(),
      spec: z.string(),
    })),
  }),
});

const team = defineCollection({
  loader: file('./src/data/team.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    image: z.string().url(),
  }),
});

const faq = defineCollection({
  loader: file('./src/data/faq.json'),
  schema: z.object({
    id: z.string(),
    label: z.string(),
    items: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })),
  }),
});

const partners = defineCollection({
  loader: file('./src/data/partners.json'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

const heroes = defineCollection({
  loader: file('./src/data/heroes.json'),
  schema: z.object({
    id: z.string(),
    image: z.string().url(),
    alt: z.string().optional(),
  }),
});

export const collections = { notes, docs, equipment, team, faq, partners, heroes };
