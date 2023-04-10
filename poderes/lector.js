const 
pollySSMLSplit      = require('polly-ssml-split'),
quitaremojis        = require('emoji-strip'),

texto_a_ssml = texto => {
        let textoProcesado = texto
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/\[/g, '')
            .replace(/]/g, '')
            .replace(/'/g, '&apos;');
        textoProcesado = quitaremojis(textoProcesado);

        const textoFinal = textoProcesado.split('\n\n').map((parrafo) => `<p>${parrafo}</p><break time="1s"/>`).join('');

        const ssml = `<speak>${textoFinal}</speak>`;
    return ssml;
},
dividir_ssml = (ssml, caracteres) => {
    const opciones = {
        // MIN length of a single batch of split text
        softLimit: caracteres || 1500,
        // MAX length of a single batch of split text
        hardLimit: caracteres || 2000,
        // Set of extra split characters (Optional property)
        extraSplitChars: ',;',
    }
  
    try {
        pollySSMLSplit.configure(opciones);
        const partes_SSML = pollySSMLSplit.split(ssml);
    if (!partes_SSML || !partes_SSML.length) return [];
  
    // Polly SSML split seems to sometimes return an empty "<speak></speak>"
    // We manually remove that from here
    const cleanSsmlParts = partes_SSML.filter((fragmento) => {
        if (fragmento !== '<speak></speak>') return fragmento;
    });
        return cleanSsmlParts;
    } catch (error) {
        throw error;
    }
},
sintetizar = async texto => {
    const
        textToSpeech    = require('@google-cloud/text-to-speech'),
        authConfig = {
            type: process.env.TYPE,
            project_id: process.env.PROJECT_ID,
            private_key_id: process.env.PRIVATE_KEY_ID,
            private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.CLIENT_EMAIL,
            client_id: process.env.CLIENT_ID,
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        },
        client = new textToSpeech.TextToSpeechClient({ projectId: process.env.PROJECT_ID, credentials: authConfig }),
        opciones = {
          // El input puede ser {text: text} o {ssml: ssml}
          input: {ssml: texto},
          voice: {languageCode: 'es-ES', name: 'es-ES-Wavenet-B', ssmlGender: 'MALE'},
          audioConfig: {audioEncoding: 'MP3', pitch: 0, speakingRate: 1}
        };
        try {
            const [respuesta] = await client.synthesizeSpeech(opciones);
            return respuesta.audioContent;
        } catch (err) {
            throw new Error(`Error al sintetizar el audio: ${err}`);
        }
},
conversionVoz = async (texto, caracteres) => {
    try {
      let buffer = null;
      
      // Split the SSML into multiple parts with the Text to Speech character limit
      let textoProcesado = texto_a_ssml(texto);
      textoProcesado = textoProcesado.replace(/\[([^\\].*)\]/g, '');
      const fragmentos = dividir_ssml(textoProcesado, caracteres);
      // Do parallel requests to the API for each SSML part
      const PromesaDeSintentizar = fragmentos.map(fragmento => sintetizar(fragmento));
      // Wait for the requests to resolve
      // We end up with an array of Buffer's
      const allAudioBuffers = await Promise.all(PromesaDeSintentizar);
      buffer = Buffer.concat(allAudioBuffers, allAudioBuffers.reduce((len, a) => len + a.length, 0));
      return buffer;
    } catch (err) {
      console.error(err);
      throw new Error('Error al generar el archivo de audio.');
    }
};

module.exports = conversionVoz;