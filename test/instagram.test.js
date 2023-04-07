require('dotenv').config({ path: '.env.test' });

const 
  { extraerDatos, getAccessToken, renewAccessToken } = require('../poderes/Instagram'),
  axios = require('axios'),
  moment = require('moment'),
  { MongoClient } = require('mongodb');

  jest.mock('axios');
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
  jest.mock("./instagram", () => {
    return {
      extraerDatos: jest.requireActual("./instagram").extraerDatos,
      getAccessToken: jest.fn(),
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





jest.mock('axios');

describe('Función renewAccessToken()', () => {
  it('Renueva y guarda el nuevo token de acceso en la base de datos', async () => {
    const mockAccessToken = 'mockAccessToken';
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
    jest.spyOn(moment, 'format').mockImplementation(() => {
      if (moment.format.mock.calls.length === 1) {
        return mockNewAccessTokenInfo.FechaSol;
      } else {
        return mockNewAccessTokenInfo.FechaFin;
      }
    });

    // Ejecutar la función renewAccessToken
    const newAccessTokenInfo = await renewAccessToken(mockAccessToken, mockTokenInfo);

    // Verificar que se haya llamado a axios.get con los parámetros correctos
    expect(axios.get).toHaveBeenCalledWith(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${mockAccessToken}`);

    // Verificar que se haya actualizado el token de acceso en la base de datos
    expect(MongoClient.prototype.updateOne).toHaveBeenCalledWith({}, { $set: mockNewAccessTokenInfo });

    // Verificar que la función devuelva la información del nuevo token de acceso
    expect(newAccessTokenInfo).toEqual(mockNewAccessTokenInfo);
  });

  it('Lanza un error si falla la renovación del token de acceso', async () => {
    // Simular un error al renovar el token de acceso
    axios.get.mockRejectedValue(new Error('Error al renovar el token de acceso'));

    // Ejecutar la función renewAccessToken y verificar que se lance un error
    await expect(renewAccessToken('mockAccessToken', {})).rejects.toThrow('Error al renovar el token de acceso');
  });
});