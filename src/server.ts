import express, { Express, Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import { Vault, VaultOptions } from './vault';
import * as fs from 'fs';
import * as utils from './utils';
import path from 'path';

type VaultServerOptions = {
	port: number;
} & VaultOptions;

type VaultServerConfigFile = {
	servers: VaultServerConfigServer[];
}

type VaultServerConfigServer = {
	port: number;
	path: string;
};

class VaultServer {
	app: Express;
	vault: Vault;

	static FromVaultConfigAuto(): VaultServer[] {
		let vaultConfigPath = __dirname;
		let safety = 10;

		while (safety > 0 && !fs.existsSync(path.join(vaultConfigPath,'.vaultrc.json'))) {
			vaultConfigPath = path.join(vaultConfigPath,'../');
			safety--;
		}

		if (!fs.existsSync(path.join(vaultConfigPath,'.vaultrc.json'))) {
			throw new Error('.vaultrc.json not found');
		}

		return VaultServer.FromVaultConfig(path.join(vaultConfigPath,'.vaultrc.json'));
	}

	static FromVaultConfig(pth:string): VaultServer[] {
		return VaultServer.FromVaultConfigContent(fs.readFileSync(pth).toString(),path.join(pth,'../'));
	}

	static FromVaultConfigContent(content:string,basePath:string): VaultServer[] {
		const contentObject = JSON.parse(content) as VaultServerConfigFile;
		return contentObject.servers.map((server) => {
			return new VaultServer({
				path:path.join(basePath,server.path),
				port:server.port
			});
		});
	}

	constructor(options: VaultServerOptions) {		
		this.app = express();
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(bodyParser.json());

		this.vault = new Vault(options);

		const vaultMount = this.vault;

		this.app.get('/', function (req: Request, res: Response) {
			res.send('This is a vault');
		});

		this.app.get('/object', function (req: Request, res: Response) {
			try {
				const result: string = vaultMount.getObject(req.query.hash);
				res.status(200).send(result);
			} catch (e: any) {
				res.status(400).send(e.toString());
			}
		});

		this.app.get('/pull', function (req: Request, res: Response) {
			try {
				const result: string[] = vaultMount.objectList();
				res.status(200).send(JSON.stringify(result));
			} catch (e: any) {
				res.status(400).send(e.toString());
			}
		});

		this.app.post('/upload', function (req: Request, res: Response) {
			try {
				vaultMount.uploadObject(req.body.content);
				res.status(200).send(utils.hashHelper(req.body.content));
			} catch (e: any) {
				res.status(400).send(e.toString());
			}
		});

		this.app.get('/manifesto.jason', function (req: Request, res: Response) {
			res.send('Information should be free.<br>Free Speech and Privacy are fundamental human rights.<br>Han shot first.');
		});

		this.app.listen(options.port);
	}
}

export { VaultServer, VaultServerOptions, VaultServerConfigFile, VaultServerConfigServer };
