const { enviar } = require('../poderes/contacto');

// Crear mocks para transporte.sendMail y axios.post
const transporte = { sendMail: jest.fn()};
const axiosPost = jest.fn();

// Crear un contexto mock
const createContext = (body) => ({
  request: { body },
  status: 0,
  body: null,
});

beforeEach(() => {
    transporte.sendMail.mockReset();
    axiosPost.mockReset();
  });

test('Contacto: Debe enviar el correo electrónico si Recaptcha es válido y el correo electrónico es válido', async () => {
  const ctx = createContext({
    email: 'test@example.com',
    nombre: 'John Doe',
    mensaje: 'Hello, World!',
    gcaptcha: 'test-gcaptcha',
  });

  axiosPost.mockResolvedValue({
    data: {
      action: 'contacto',
      score: 0.5,
      success: true,
    },
  });

  await enviar(ctx, transporte, axiosPost);

  expect(transporte.sendMail).toHaveBeenCalled();
  expect(ctx.status).toBe(200);
  expect(ctx.body.message).toBe('Formulario enviado con éxito');
});

test('Contacto: No debe enviar correo electrónico si recaptcha no es válido', async () => {
  const ctx = createContext({
    email: 'test@example.com',
    nombre: 'John Doe',
    mensaje: 'Hello, World!',
    gcaptcha: 'test-gcaptcha',
  });

  axiosPost.mockResolvedValue({
    data: {
      action: 'contact',
      score: 0.3,
      success: true,
    },
  });

  await enviar(ctx, transporte, axiosPost);

  expect(transporte.sendMail).not.toHaveBeenCalled();
  expect(ctx.status).toBe(400);
  expect(ctx.body.message).toBe('No se pudo verificar el captcha');
});

test('Contacto: No debe enviar correo electrónico si el correo electrónico no es válido', async () => {
  const ctx = createContext({
    email: 'invalid-email',
    nombre: 'John Doe',
    mensaje: 'Hello, World!',
    gcaptcha: 'test-gcaptcha',
  });

  axiosPost.mockResolvedValue({
    data: {
      action: 'contacto',
      score: 0.5,
      success: true,
    },
  });

  await enviar(ctx, transporte, axiosPost);

  expect(transporte.sendMail).not.toHaveBeenCalled();
  expect(ctx.status).toBe(400);
  expect(ctx.body.message).toBe('No se pudo verificar el captcha');
});

test('Contacto: Se gestionan errores mientras se envía el correo electrónico', async () => {
const ctx = createContext({
    email: 'test@example.com',
    nombre: 'John Doe',
    mensaje: 'Hello, World!',
    gcaptcha: 'test-gcaptcha',
  });

  axiosPost.mockResolvedValue({
    data: {
      action: 'contacto',
      score: 0.5,
      success: true,
    },
  });

  // Simular un error al enviar el correo
  const error = new Error('Error al enviar el correo');
  transporte.sendMail.mockRejectedValue(error);

  await enviar(ctx, transporte, axiosPost);

  expect(transporte.sendMail).toHaveBeenCalled();
  expect(ctx.status).toBe(500);
  expect(ctx.body.message).toBe('Error al enviar el formulario');
  expect(ctx.body.error).toBe(error);
});

test('Contacto: Se gestionan los errores mientras se verifica el recaptcha', async () => {
  const ctx = createContext({
    email: 'test@example.com',
    nombre: 'John Doe',
    mensaje: 'Hello, World!',
    gcaptcha: 'test-gcaptcha',
  });

  // Simular un error al verificar el recaptcha
  const error = new Error('Error al verificar el recaptcha');
  axiosPost.mockRejectedValue(error);

  await enviar(ctx, transporte, axiosPost);

  expect(transporte.sendMail).not.toHaveBeenCalled();
  expect(ctx.status).toBe(500);
  expect(ctx.body.message).toBe('Error al enviar el formulario');
  expect(ctx.body.error).toBe(error);
});

