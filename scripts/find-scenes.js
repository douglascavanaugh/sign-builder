#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'shopify-products.json'), 'utf-8')
)

const keywords = ['scene', 'silhouette', 'wildlife', 'mountain', 'elk', 'deer', 'bear', 'moose', 'horse', 'eagle', 'wolf', 'buffalo', 'bison', 'cowboy', 'ranch', 'cabin', 'pine', 'forest', 'custom sign', 'create your own']

console.log('=== Products matching "scene" ===')
const scenes = products.filter((p) =>
  p.title.toLowerCase().includes('scene') || p.handle.includes('scene')
)
scenes.forEach((p) => console.log(`  ${p.handle} — "${p.title}" (${p.imageCount} imgs)`))
console.log(`  Total: ${scenes.length}\n`)

console.log('=== Products matching "silhouette" ===')
const silhouettes = products.filter((p) =>
  p.title.toLowerCase().includes('silhouette') || p.handle.includes('silhouette')
)
silhouettes.forEach((p) => console.log(`  ${p.handle} — "${p.title}" (${p.imageCount} imgs)`))
console.log(`  Total: ${silhouettes.length}\n`)

console.log('=== Products matching other wildlife/outdoor keywords ===')
const others = products.filter((p) => {
  const text = (p.title + ' ' + p.handle).toLowerCase()
  return keywords.some((k) => text.includes(k)) &&
    !text.includes('scene') && !text.includes('silhouette')
})
console.log(`  Total: ${others.length}`)
others.slice(0, 30).forEach((p) => console.log(`  ${p.handle} — "${p.title}"`))
if (others.length > 30) console.log(`  ... and ${others.length - 30} more`)

console.log('\n=== All unique product collections/categories in titles ===')
const allTitles = products.map((p) => p.title)
const uniqueWords = new Set()
allTitles.forEach((t) => {
  t.split(/[\s\-–—]+/).forEach((w) => {
    if (w.length > 3) uniqueWords.add(w.toLowerCase())
  })
})

const sceneRelated = [...uniqueWords].filter((w) =>
  ['scene', 'silhouette', 'wildlife', 'outdoor', 'nature', 'landscape', 'panoram'].some((k) => w.includes(k))
).sort()
console.log('Scene-related words found in titles:', sceneRelated.join(', ') || 'none')
