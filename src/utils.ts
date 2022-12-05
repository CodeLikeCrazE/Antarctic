import * as crypto from 'crypto';

/**
 * Hashes a string and gives a base64 digest
 *
 * @param {string} content - The content to be hashed
 * @returns {string} The result
 */
function hashHelper(content: string): string {
	return crypto.createHash('sha256').update(content).digest('base64').split('/').join('').split('+').join('').split('=').join('');
}

export {
	hashHelper
};
