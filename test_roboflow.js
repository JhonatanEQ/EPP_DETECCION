
const fs = require('fs');
const path = require('path');

const API_KEY = 'xxxxxxxxxxxxxxxxxxx';
const API_URL = 'https://serverless.roboflow.com/workspace-ydydf/workflows/find-cascos-glasses-helmets-masks-vests-gloves-shirts-pants-and-boots-4';
const IMAGE_PATH = 'API/models/prueba/IMG-20251125-WA0067.jpg';

const OUTPUT_FILE = path.resolve(process.cwd(), 'roboflow_output.txt');

console.log('\n' + '='.repeat(70));
console.log('PRUEBA DE ROBOFLOW API (Guardando resultado)');
console.log('='.repeat(70) + '\n');

console.log('El archivo se intentará guardar en:');
console.log('   ', OUTPUT_FILE, '\n');

async function testRoboflowAPI() {
    try {
        const imagePath = path.join(__dirname, IMAGE_PATH);
        if (!fs.existsSync(imagePath)) {
            const msg = `No se encontró la imagen en: ${imagePath}`;
            console.error(msg);

            fs.writeFileSync(
                OUTPUT_FILE,
                JSON.stringify({ error: msg }, null, 2),
                'utf8'
            );
            console.log('\nSe guardó el mensaje de error en:', OUTPUT_FILE);
            return;
        }

        console.log('Imagen:', path.basename(imagePath));

        const imageBuffer = fs.readFileSync(imagePath);
        const base64Image = imageBuffer.toString('base64');

        console.log('📡 Enviando solicitud a Roboflow...\n');

        const payload = {
            api_key: API_KEY,
            inputs: {
                image: {
                    type: 'base64',
                    value: base64Image
                }
            }
        };

        if (typeof fetch !== 'function') {
            throw new Error('fetch no está definido. Usa Node 18+ o instala node-fetch.');
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();

        let jsonResult = null;
        try {
            jsonResult = JSON.parse(text);
        } catch (e) {

            jsonResult = { raw: text };
        }

        fs.writeFileSync(
            OUTPUT_FILE,
            JSON.stringify(
                {
                    status: response.status,
                    ok: response.ok,
                    body: jsonResult
                },
                null,
                2
            ),
            'utf8'
        );

        console.log('Respuesta de Roboflow guardada en:');
        console.log(' ', OUTPUT_FILE, '\n');

        console.log('Claves de primer nivel:');
        if (jsonResult && typeof jsonResult === 'object' && !Array.isArray(jsonResult)) {
            console.log(' ', Object.keys(jsonResult));
        } else {
            console.log('(No es un objeto JSON estándar, revisa el txt)');
        }

        console.log('\Prueba completada.\n');

    } catch (error) {
        console.error('\n ERROR:', error.message);

        try {
            fs.writeFileSync(
                OUTPUT_FILE,
                JSON.stringify({ error: error.message }, null, 2),
                'utf8'
            );
            console.log('\nDetalle del error guardado en:', OUTPUT_FILE);
        } catch (e2) {
            console.error('Además falló al escribir el archivo:', e2.message);
        }
    }
}

testRoboflowAPI();
