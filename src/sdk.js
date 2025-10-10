// SDK para integração com o servidor de API Keys
// Uso:
// const sdk = require('./sdk');
// sdk.generateKey(serverApiKey).then(console.log)
// sdk.verifyKey(serverApiKey, key).then(console.log)

const axios = require('axios');

// Gera uma key de servidor (endpoint público)
function generateServerKey(serverUrl) {
    return axios.get(`${serverUrl}/server-generate`).then(res => res.data);
}

// Valida uma key usando /server-verify/:key (autenticado)
function verifyServerKey(serverApiKey, serverUrl, key) {
    return axios.get(`${serverUrl}/server-verify/${key}`, {
        headers: { 'x-server-api-key': serverApiKey }
    }).then(res => res.data);
}

module.exports = {
    generateServerKey,
    verifyServerKey
};
