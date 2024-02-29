import express, { Express, Request, Response } from 'express'
import { PKPass } from 'passkit-generator'
import fs from 'node:fs'
import path from 'node:path'  


function getFile(name: string) {
  const dir = path.join(__dirname, `../certs/${name}`)
  return fs.readFileSync(dir)
}

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

PKPass.from(
  {
    model: path.join(__dirname, '/models/custom.pass'),
    certificates: {
      wwdr: getFile('wwdr.pem'),
      signerCert: getFile('signerCert.pem'),
      signerKey: getFile('signerKey.pem'),
      signerKeyPassphrase: "admin123"
    }
  },
  {
    authenticationToken: "KqnYPAnysRXyk8VygxHkTlksSiw7oOv3jUS0hVXI3lM1KXdkP82rjXbhQ+0d/AsO",
    webServiceURL: 'https://e9c8-112-207-177-72.ngrok-free.app',
    serialNumber: 'proxa-pass-123',
    description: 'test description pass',
    logoText: 'from pkpass config',
  }
).then(async (newPass) => {
  newPass.setBarcodes({
    format: 'PKBarcodeFormatQR',
    message: 'https://rsvp-fe-alpha.vercel.app/',
    altText: 'rsvp link',
  })

  const name = `${Date.now()}.pkpass`
  const dir = path.join(__dirname, `../passes/${name}`)
  const buffer = newPass.getAsBuffer()

  fs.writeFile(dir, buffer, (error) => {
    console.log({error})
  })
})

app.get('/', (req: Request, res: Response) =>  {
  res.status(200).json({ success: "true", hello: "world" })
})

app.post('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', async (req, res) => {
  const data = {
    params: req.params,
    body: req.body,
    headers: req.headers
  }

  console.log(data)

  res.status(200).json(data)
})

app.listen(8080, () => {
  console.log('server running')
})