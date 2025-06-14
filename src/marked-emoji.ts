import EmojiJS from 'emoji-js'

// Initialize emoji-js instance
const emoji = new EmojiJS()
emoji.img_set = 'apple'
emoji.use_css_imgs = false
emoji.allow_native = true

// Emoji extension for marked
export const emojiExtension = {
  name: 'emoji',
  level: 'inline' as const,
  start(src: string) {
    return src.indexOf(':')
  },
  tokenizer(src: string) {
    const rule = /^:(\w+):/
    const match = rule.exec(src)
    if (match) {
      const emojiName = match[1]
      // Use emoji-js to convert shortcode to unicode
      const emojiChar = emoji.replace_colons(`:${emojiName}:`)
      // Check if emoji was actually converted (not the same as input)
      if (emojiChar !== `:${emojiName}:`) {
        return {
          type: 'emoji',
          raw: match[0],
          emoji: emojiName,
          char: emojiChar,
        }
      }
    }
  },
  renderer(token: any) {
    return `<span class="emoji" title=":${token.emoji}:">${token.char}</span>`
  },
}
