// much of this is from http://stackoverflow.com/questions/34814480/how-to-load-a-public-key-in-pem-format-for-encryption

export class Crypto {

    pubKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtKwVvZBCxI24bfuKg5yU
g5vY+vm8nhukVdU400w5DjmiolMFrcCyDh2IjEjL23fXO8J5M9SMKA9QOJ9zLKGO
bzIdwdZPLc8F+p5UkA25kyLL46BSKkbrhNRYe+yG544qElbZcRhnhuc6WSCq6T0m
4rQMtnpfHZfSyvx4YUIM6pUgT/Pxehcj9hj45ppsi3QLGnFP6vHCDzeGnJt8QIdJ
hTSlSIROvkcH+aa6sj7Ekc5oNt7KHbzh+ZnWd7jHSYyGOCVRp/fuIUvENcOuvLP1
zFtvb8KLJ8fzQZNImzBOxo2tsGNR8PdeNtFb1iosrI+5XPKLBt89acLyGpYJ4OXz
WwIDAQAB
-----END PUBLIC KEY-----`

    constructor() {
        if(! crypto.subtle) {
            console.error('Crypto API not supported!')
        } else {

            var self = this
            this.importPublicKey(this.pubKey).then((key) => {
                this.importedPubKey = key
                console.log('public key imported')
            })
        }
    }

    test_crypto() {
        var private_key_object = null;
        var public_key_object = null;

        var promise_key = null;

        var crypto = window.crypto || window.msCrypto;

        if (crypto.subtle) {
            alert("Cryptography API Supported");

            // Parameters:
            // 1. Asymmetric Encryption algorithm name and its requirements
            // 2. Boolean indicating extractable. which indicates whether or not the raw keying material may be exported
            // by the application (http://www.w3.org/TR/WebCryptoAPI/#dfn-CryptoKey-slot-extractable)
            // 3. Usage of the keys. (http://www.w3.org/TR/WebCryptoAPI/#cryptokey-interface-types)
            promise_key = crypto.subtle.generateKey({
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: {name: "SHA-256"}
            }, false, ["encrypt", "decrypt"]);

            promise_key.then(function (key) {
                private_key_object = key.privateKey;
                public_key_object = key.publicKey;
            });

            promise_key.catch = function (e) {
                console.log(e.message);
            }

        }
        else {
            alert("Cryptography API not Supported")
        }
    }

    // returns a promise for the encrypted cleartext or null if failed
    encryptionPromise(cleartext) {
        if(! this.importedPubKey) {
            console.error('no pubkey imported')
            return null
        }

        var promise = crypto.subtle.encrypt(this.encryptAlgorithm, this.importedPubKey, this.textToArrayBuffer(cleartext))
        return promise
    }


    crypto = window.crypto || window.msCrypto
    encryptAlgorithm = {
        name: "RSA-OAEP",
        hash: {
            name: "SHA-1"
        }
    };


    arrayBufferToBase64String(arrayBuffer) {
        var byteArray = new Uint8Array(arrayBuffer)
        var byteString = ''
        for (var i = 0; i < byteArray.byteLength; i++) {
            byteString += String.fromCharCode(byteArray[i])
        }
        return btoa(byteString)
    }


    base64StringToArrayBuffer(b64str) {
        var byteStr = atob(b64str)
        var bytes = new Uint8Array(byteStr.length)
        for (var i = 0; i < byteStr.length; i++) {
            bytes[i] = byteStr.charCodeAt(i)
        }
        return bytes.buffer
    }

    textToArrayBuffer(str) {
        var buf = unescape(encodeURIComponent(str)) // 2 bytes for each char
        var bufView = new Uint8Array(buf.length)
        for (var i = 0; i < buf.length; i++) {
            bufView[i] = buf.charCodeAt(i)
        }
        return bufView
    }


    convertPemToBinary(pem) {
        var lines = pem.split('\n')
        var encoded = ''
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim().length > 0 &&
                lines[i].indexOf('-BEGIN RSA PRIVATE KEY-') < 0 &&
                lines[i].indexOf('-BEGIN RSA PUBLIC KEY-') < 0 &&
                lines[i].indexOf('-BEGIN PUBLIC KEY-') < 0 &&
                lines[i].indexOf('-END PUBLIC KEY-') < 0 &&
                lines[i].indexOf('-END RSA PRIVATE KEY-') < 0 &&
                lines[i].indexOf('-END RSA PUBLIC KEY-') < 0) {
                encoded += lines[i].trim()
            }
        }
        return this.base64StringToArrayBuffer(encoded)
    }

    importPublicKey(pemKey) {
        var self = this
        return new Promise( (resolve) => {
            var importer = crypto.subtle.importKey("spki", self.convertPemToBinary(pemKey), self.encryptAlgorithm, false, ["encrypt"])
            importer.then(function (key) {
                resolve(key)
            })
        })
    }

}