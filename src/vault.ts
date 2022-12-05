import * as path from 'path';
import * as fs from 'fs';
import * as utils from './utils';

type VaultOptions = {
	path?: string;
	title?: string;
	basePath?: string;
};

class Vault {
	cache: Record<string, string> = {};
	path: string;
	
	get objectListPath() {
		return path.join(this.path,'objects');
	}

	constructor(options: VaultOptions) {
		// Validate input

		if (options.path != null) {
			this.path = options.path;
		} else if (options.title != null) {
			this.path = path.join(options.basePath || __dirname, 'vaults', options.title);
		} else {
			throw new Error('No path or title provided in options');
		}

		// Create folder
		fs.mkdirSync(this.path, {
			recursive:true
		});
		fs.mkdirSync(this.objectListPath, {
			recursive:true
		});
	}

	uploadObject(content: string): void {
		// Validate input

		if (content == null) {
			throw new Error('No content provided to upload');
		}

		// Upload
		const hash = utils.hashHelper(content);
		const objectPath = path.join(this.objectListPath, hash);

		if (!fs.existsSync(objectPath)) {
			fs.writeFileSync(objectPath, content);
		}
	}

	getObject(hash: any): string {
		// Validate input
		if (!hash) {
			throw new Error('No hash provided');
		}

		// Get
		hash = hash as string;
		
		if (!this.cache[hash]) {
			const objectPath = path.join(this.objectListPath, hash);
			if (!fs.existsSync(objectPath)) {
				throw new Error('Not found');
			} else {
				this.cache[hash] = fs.readFileSync(objectPath).toString();
			}
		}
		return this.cache[hash];
	}

	objectList(): string[] {
		return fs.readdirSync(this.objectListPath);
	}
}

export {
	Vault,
	VaultOptions
};
