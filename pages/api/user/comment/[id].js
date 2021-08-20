import { useRouter } from 'next/router'

const cmts = {}

export default async (req, res) => {
  await new Promise(r => setTimeout(r, 1000))

  const { id } = req.query

  if (req.method === 'POST') {
        const { text } = req.body

    // sometimes it will fail, this will cause a regression on the UI

    if (Math.random() > 0.9) {
      res.status(204)
      res.json({ message: 'Could not add item!' })
      return
    }

    if (cmts[id])
    cmts[id].push(text.toUpperCase())
    else cmts[id] = [text.toUpperCase()];
    res.json(text.toUpperCase())
    return
  } else {
    res.json({
      ts: Date.now(),
      comments: cmts[id] ?? [],
    })
  }
}
