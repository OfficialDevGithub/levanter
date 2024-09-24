const { getFilter, bot, setFilter, deleteFilter, lydia } = require('../lib/')

// Command to delete filters in chat
bot(
  {
    pattern: 'stop ?(.*)',
    desc: 'Delete filters in chat',
    type: 'group',
    onlyGroup: true,
  },
  async (message, match) => {
    if (!match) return await message.send(`_Example : .stop hi_`)
    const isDel = await deleteFilter(message.jid, match)
    if (!isDel) return await message.send(`_${match} not found in filters_`)
    return await message.send(`_${match} deleted._`)
  }
)

// Command to set filters in groups
bot(
  {
    pattern: 'filter ?(.*)',
    desc: 'filter in groups',
    type: 'group',
    onlyGroup: true,
  },
  async (message, match) => {
    match = match.match(/\'\" • .*?[\'\"]/gms)
    if (!match) {
      const filters = await getFilter(message.jid)
      if (!filters) return await message.send(`_Not set any filter_\n_Example filter 'hi' 'hello'_`)
      let msg = ''
      filters.map(({ pattern }) => {
        msg += `- ${pattern}\n`
      })
      return await message.send(msg.trim())
    } else {
      if (match.length < 2) {
        return await message.send(`Example filter 'hi' 'hello'`)
      }
      const k = match[0].replace(/['"]+/g, '')
      const v = match[1].replace(/['"]+/g, '')
      if (k && v) await setFilter(message.jid, k, v, match[0][0] === "'" ? true : false)
      await message.send(`_${k}_ added to filters.`)
    }
  }
)

// Main text handling logic for filters and custom replies
bot({ on: 'text', fromMe: false, type: 'filterOrLydia' }, async (message, match) => {
  const filters = await getFilter(message.jid)
  if (filters) {
    for (const { pattern, text } of filters) {
      const regex = new RegExp(`(?:^|\\W)${pattern}(?:$|\\W)`, 'i')
      if (regex.test(message.text)) {
        await message.send(text, {
          quoted: message.data,
        })
        return; // Exit after sending a filter response
      }
    }
  }

  // Custom reply logic based on specific conditions
  if (message.text.toLowerCase() === 'ping') {
    return await message.send('Hi there! How can I assist you today?');
  } else if (message.text.toLowerCase() === 'help me') {
    return await message.send('Here are some commands you can use: .filter, .stop, etc.');
  }

  const isLydia = await lydia(message)
  if (isLydia) return await message.send(isLydia, { quoted: message.data })
})

// Logic for handling messages from the bot itself
bot({ on: 'text', fromMe: true, type: 'lydia' }, async (message, match) => {
  const isLydia = await lydia(message)
  if (isLydia) return await message.send(isLydia, { quoted: message.data })
})