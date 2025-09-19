import app from './app'

const PORT = Number(process.env.PORT ?? 3001)

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`)
})
