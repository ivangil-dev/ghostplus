const 
  { MongoClient, ObjectId }                       = require('mongodb'),
  validador                                       = require('validator'),
  moment                                          = require('moment'),
  API_Ghost                                       = require('../funciones/API_ghost'),
  { USUARIOBD, CONTRABD, SERVIDORBD, NOMBRE_BD }  = process.env,
  encodedUsername                                 = encodeURIComponent(USUARIOBD),
  encodedPassword                                 = encodeURIComponent(CONTRABD),  
  MONGODB_URI                                     = `mongodb+srv://${encodedUsername}:${encodedPassword}@${SERVIDORBD}?retryWrites=true&w=majority`,
  cliente                                         = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true }),
  limite                                          = 10;

async function ListaLectura(userId) {
  await cliente.connect();
  const bDatos = cliente.db(`${NOMBRE_BD}`);
  const collection = bDatos.collection('suscriptores');

  const readingList = await collection.findOne({ usuario: userId });
  await cliente.close();

  return readingList ? readingList.lista : [];
}

async function nuevoListaLectura(userId, articleId, article) {
  await cliente.connect();
  const bDatos = cliente.db(`${NOMBRE_BD}`);
  const collection = bDatos.collection('suscriptores');

  const EntradaLista = {
    _id: articleId,
    id: articleId,
    titulo: article.title,
    foto: article.feature_image,
    alt_foto: article.feature_image_alt,
    url: article.url,
    fecha_articulo: article.created_at,
    fecha: moment().format(),
  };

  const result = await collection.updateOne(
    { usuario: userId, 'lista.id': { $ne: articleId } },
    {
      $push: {
        lista: {
          $each: [EntradaLista],
          $slice: -limite,
        },
      },
    },
    { upsert: true }
  );

  await cliente.close();
  return result;
}

async function quitarListaLectura(userId, articleId) {
  await cliente.connect();
  const bDatos = cliente.db(`${NOMBRE_BD}`); // Reemplaza con el nombre de tu base de datos
  const collection = bDatos.collection('suscriptores');

  const result = await collection.updateOne(
    { usuario: userId, 'lista.id': { $eq: articleId } },
    {
      $pull: { lista: { id: articleId } },
    }
  );

  await cliente.close();
  return result;
}

async function limpiarListaLectura(userId) {
  await cliente.connect();
  const bDatos = cliente.db(`${NOMBRE_BD}`); // Reemplaza con el nombre de tu base de datos
  const collection = bDatos.collection('suscriptores');

  const result = await collection.deleteOne({ usuario: userId });
  await cliente.close();

  return result;
}

module.exports = {ListaLectura, nuevoListaLectura, quitarListaLectura, limpiarListaLectura}