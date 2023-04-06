const axios = require('axios');
const moment = require('moment');
const MongoClient = require('mongodb').MongoClient;

const { USUARIOBD, CONTRABD, SERVIDORBD, NOMBRE_BD } = process.env;
const encodedUsername = encodeURIComponent(USUARIOBD);
const encodedPassword = encodeURIComponent(CONTRABD);
const MONGODB_URI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${SERVIDORBD}?retryWrites=true&w=majority`;
const ACCESS_TOKEN_EXPIRATION_THRESHOLD = 864000; //10 días

async function extraerDatos(getAccessTokenFn = getAccessToken) {
  try {
    // Obtener el token de acceso válido
    const accessToken = await getAccessTokenFn();
    // Obtener los datos de las publicaciones más recientes del usuario
    const response = await axios.get(`https://graph.instagram.com/me/media?fields=id,comments_count,like_count,caption,media_type,media_url,thumbnail_url,permalink,children,timestamp&access_token=${accessToken}`);  
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Función para obtener el token de acceso válido
async function getAccessToken(renewAccessToken) {
  const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db(`${NOMBRE_BD}`);
  const tokens = db.collection('tokens');
  const tokenInfo = await tokens.findOne({});
  
  const currentTime = moment();
  const tokenExpirationTime = moment(tokenInfo.FechaFin);
  const shouldRenewToken = currentTime.isSameOrAfter(tokenExpirationTime);
  
  if (shouldRenewToken) {
    const newAccessTokenInfo = await renewAccessToken(tokenInfo.access_token, tokenInfo);
    await tokens.updateOne({}, { $set: newAccessTokenInfo });
    await client.close();
    return newAccessTokenInfo.access_token;
  } else {
    await client.close();
    return tokenInfo.access_token;
  }
}

// Función para renovar el token de acceso
async function renewAccessToken(currentAccessToken, tokenInfo) {
  try {
    const response = await axios.get(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentAccessToken}`);
    const newAccessTokenInfo = {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      expires_in: response.data.expires_in,
      FechaSol: moment().format(),
      FechaFin: moment().add(response.data.expires_in, "seconds").subtract(ACCESS_TOKEN_EXPIRATION_THRESHOLD, 'seconds').format(),
      Renovaciones: tokenInfo.Renovaciones + 1
    };
    return newAccessTokenInfo;
  } catch (error) {
    console.error('Error al renovar el token de acceso:', error.message);
    throw error;
  }
}

module.exports = { extraerDatos, getAccessToken, renewAccessToken };
