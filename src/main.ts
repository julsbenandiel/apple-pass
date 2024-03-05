import express, { Express, Request, Response } from 'express'
import { PKPass } from 'passkit-generator'
import fs from 'node:fs'
import path from 'node:path'  
import apn from 'apn'


function getFile(name: string) {
  const dir = path.join(__dirname, `../certs/${name}`)
  return fs.readFileSync(dir)
}

const app: Express = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const apn_options = {
  token: {
    key: getFile("AuthKey_97L3249J4V.p8"),
    keyId: "97L3249J4V",
    teamId: "7LUX9C2N33"
  },
  production: false
};

const pass_params = {
  model: path.join(__dirname, '/models/custom.pass'),
  certificates: {
    wwdr: getFile('wwdr.pem'),
    signerCert: getFile('signerCert.pem'),
    signerKey: getFile('signerKey.pem'),
    signerKeyPassphrase: "admin123"
  }
}

const pass_opts = {
  authenticationToken: "UPDATE_TOKEN",
  webServiceURL: 'https://12ea-112-207-177-72.ngrok-free.app',
  serialNumber: 'apple-pass-123',
  description: 'test description pass',
  logoText: 'LOGO TEXT NEW!',
}

const apnProvider = new apn.Provider(apn_options);

// test notification
let deviceToken = "DEVICE TOKEN"
var note = new apn.Notification();

note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
note.badge = 3;
note.sound = "ping.aiff";
note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
note.payload = {'messageFrom': 'John Appleseed'};
note.topic = "<your-app-bundle-id>";

apnProvider.send(note, deviceToken).then( (result) => {
  console.log({ result })
  if (result.failed) {
    console.log('failed:', result.failed)
  }
});

app.get('/', (req: Request, res: Response) =>  {
  res.status(200).json({ success: "true", hello: "world" })
})

app.post('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber', async (req, res) => {
  console.log('Register a Pass for Update Notifications')
  const data = {
    params: req.params,
    body: req.body,
    headers: req.headers
  }

  res.status(201).json(data)
})

app.get('/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier', async (req, res) => {
  console.log('Get the List of Updatable Passes')
  const data = {
    params: req.params,
    query: req.query,
    headers: req.headers
  }

  console.log(data)

  res.status(200).json(pass_opts)
})

app.get('/v1/passes/:passTypeIdentifier/:serialNumber', async (req, res) => {
  console.log('Send an Updated Pass')
  PKPass.from(pass_params, pass_opts).then(async (newPass) => {
    newPass.setBarcodes({
      format: 'PKBarcodeFormatQR',
      message: 'http://google.com',
      altText: 'google link test',
    })

    const name = `${Date.now()}.pkpass`
    const dir = path.join(__dirname, `../passes/${name}`)
    const buffer = newPass.getAsBuffer()

    fs.writeFile(dir, buffer, (error) => {
      console.log({error})
    })
    
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass')
    return res.status(200).end(buffer)
  })
})

app.listen(8081, () => {
  console.log('server running')
})