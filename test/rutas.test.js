const 
    request = require('supertest'),
    app = require('../app');

describe('Rutas frontend', () => {
  it('Debería devolver un código de estado 200 para la ruta /', async () => {
    const response = await request(app.callback()).get('/');
    expect(response.status).toBe(200);
  });
});