require('dotenv').config({ path: '.env.test' });

const 
  axios = require('axios'),
  moment = require('moment'),
  
  { MongoMemoryServer } = require('mongodb-memory-server'),
  { MongoClient } = require('mongodb'),
  { extraerDatos, getAccessToken, renewAccessToken } = require('../poderes/Instagram');

  const { USUARIOBD, CONTRABD, SERVIDORBD, NOMBRE_BD } = process.env;
const encodedUsername = encodeURIComponent(USUARIOBD);
const encodedPassword = encodeURIComponent(CONTRABD);
const MONGODB_URI = `mongodb+srv://${encodedUsername}:${encodedPassword}@${SERVIDORBD}?retryWrites=true&w=majority`;
const ACCESS_TOKEN_EXPIRATION_THRESHOLD = 864000; //10 días

  jest.mock('axios');
  jest.mock('moment', () => {
    const moment = jest.requireActual('moment');
    moment.prototype.format = jest.fn();
    return moment;
  });
  jest.mock('mongodb', () => {
    const mClient = {
      connect: jest.fn(),
      db: jest.fn().mockReturnThis(),
      collection: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      close: jest.fn(),
    };
    return { MongoClient: jest.fn(() => mClient) };
  });
  jest.mock("../poderes/Instagram", () => {
    return {
      extraerDatos: jest.requireActual("../poderes/Instagram").extraerDatos,
      getAccessToken: jest.fn(),
      renewAccessToken: jest.requireActual("../poderes/Instagram").renewAccessToken,
    };
  });

describe('Función extraerDatos()', () => { 
  beforeEach(() => {
    getAccessToken.mockResolvedValue("1234567890");
  })
  it('Extrae los datos de Instagram', async () => {
    const mockData = {
      data: [{
          id: "123",
          comments_count: 5,
          like_count: 25,
          caption: "Una foto genial",
          media_type: "IMAGE",
          media_url: "https://example.com/foto.jpg",
          thumbnail_url: "https://example.com/foto_thumbnail.jpg",
          permalink: "https://www.instagram.com/p/123/",
          children: null,
          timestamp: "2023-04-04T18:00:00+0000",
      },],
    };

    axios.get.mockResolvedValue(mockData);
    const datos = await extraerDatos(getAccessToken);

    expect(getAccessToken).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith(`https://graph.instagram.com/me/media?fields=id,comments_count,like_count,caption,media_type,media_url,thumbnail_url,permalink,children,timestamp&access_token=1234567890`);
    expect(datos).toEqual(mockData.data);
  });
  it('Lanzar un error si falla la extracción de los datos de Instagram', async () => {
    // Simular un error al obtener los datos de Instagram
    jest.spyOn(axios, 'get').mockRejectedValue(new Error('Error al extraer los datos de Instagram'));

    await expect(extraerDatos(getAccessToken)).rejects.toThrow('Error al extraer los datos de Instagram');
  });
});

describe('Función renewAccessToken()', () => {

  let client;
  let db;
  let mongod;
  
  
  beforeAll(async () => {
    mongod = new MongoMemoryServer({});
    const uri = await mongod.start();
    client = await MongoClient.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    db = client.db();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  jest.mock('axios');
    
  it('Renueva y guarda el nuevo token de acceso en la base de datos', async () => {
    const mockAccessToken = '1234567890';
    const mockTokenInfo = {
      access_token: 'oldAccessToken',
      token_type: 'bearer',
      expires_in: 3600,
      FechaSol: '2023-04-04T18:00:00+0000',
      FechaFin: '2023-04-04T19:00:00+0000',
      Renovaciones: 1,
    };

    const mockNewAccessTokenInfo = {
      access_token: 'newAccessToken',
      token_type: 'bearer',
      expires_in: 3600,
      FechaSol: '2023-04-04T20:00:00+0000',
      FechaFin: '2023-04-04T21:00:00+0000',
      Renovaciones: 2,
    };

    // Simular la respuesta de axios al renovar el token de acceso
    axios.get.mockResolvedValue({
      data: {
        access_token: mockNewAccessTokenInfo.access_token,
        token_type: mockNewAccessTokenInfo.token_type,
        expires_in: mockNewAccessTokenInfo.expires_in,
      },
    });

    // Simular el comportamiento de moment().format() al llamar a renewAccessToken
    jest.spyOn(moment.prototype, 'format').mockImplementation(() => {
      if (moment.prototype.format.mock.calls.length === 1) {
        return mockNewAccessTokenInfo.FechaSol;
      } else {
        return mockNewAccessTokenInfo.FechaFin;
      }
    });
    const newAccessTokenInfo = await renewAccessToken(mockTokenInfo.access_token, mockTokenInfo, db);

    // Verificar que se haya llamado a axios.get con los parámetros correctos
    expect(axios.get).toHaveBeenCalledWith(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${mockTokenInfo.access_token}`);

    // Verificar que se haya actualizado el token de acceso en la base de datos
    const updatedTokenInfo = await db.collection('tokens').findOne({});
    expect(updatedTokenInfo).toEqual(mockNewAccessTokenInfo);

    // Verificar que la función devuelva la información del nuevo token de acceso
    expect(newAccessTokenInfo).toEqual(mockNewAccessTokenInfo);
  });

  it('Lanza un error si falla la renovación del token de acceso', async () => {
    // Simular un error al renovar el token de acceso
    axios.get.mockRejectedValue(new Error('Error al renovar el token de acceso'));

    // Ejecutar la función renewAccessToken y verificar que se lance un error
    await expect(renewAccessToken(getAccessToken, {})).rejects.toThrow('Error al renovar el token de acceso');
  });
});