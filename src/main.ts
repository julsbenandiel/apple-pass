import express, { Express, Request, Response } from 'express'
import { PKPass } from 'passkit-generator'
import fs from 'node:fs'
import path from 'node:path'  


function getFile(name: string) {
  const dir = path.join(__dirname, `../certs/${name}`)
  return fs.readFileSync(dir)
}

const app: Express = express()

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
    
  }
).then(async (newPass) => {
  // configs
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
  res.status(200).json({ success: "true" })
})

app.listen(8080, () => {
  console.log('server running')
})