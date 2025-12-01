const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ROBOFLOW_CONFIG = {
    apiKey: process.env.ROBOFLOW_API_KEY,
    workspace: process.env.ROBOFLOW_WORKSPACE,
    workflowId: process.env.ROBOFLOW_WORKFLOW_ID,
    apiUrl: process.env.ROBOFLOW_API_URL
};

const EPP_CLASSES = [
    'barbijo',
    'botas',
    'camisa_jean',
    'casco',
    'chaleco',
    'guantes',
    'lentes',
    'pantalon'
];

const CLASS_MAPPING = {
    'mask': 'barbijo',
    'masks': 'barbijo',

    'boot': 'botas',
    'boots': 'botas',

    'shirt': 'camisa_jean',
    'shirts': 'camisa_jean',

    'helmet': 'casco',
    'helmets': 'casco',
    'cascos': 'casco',

    'vest': 'chaleco',
    'vests': 'chaleco',

    'glove': 'guantes',
    'gloves': 'guantes',

    'glasses': 'lentes',
    'glass': 'lentes',

    'pant': 'pantalon',
    'pants': 'pantalon',

    'barbijo': 'barbijo',
    'botas': 'botas',
    'camisa_jean': 'camisa_jean',
    'casco': 'casco',
    'chaleco': 'chaleco',
    'guantes': 'guantes',
    'lentes': 'lentes',
    'pantalon': 'pantalon'
};

function processDetections(roboflowResponse) {
    const outputs = roboflowResponse.outputs || [];
    if (!outputs.length) {
        return {
            totalDetections: 0,
            detectionsByClass: {},
            allDetections: []
        };
    }

    const predictionsBlock = outputs[0].predictions;

    let detectionsArray = [];

    if (Array.isArray(predictionsBlock)) {
        detectionsArray = predictionsBlock;
    } else if (
        predictionsBlock &&
        Array.isArray(predictionsBlock.predictions)
    ) {
        detectionsArray = predictionsBlock.predictions;
    } else {
        console.warn('No se encontraron predicciones en la respuesta de Roboflow');
        return {
            totalDetections: 0,
            detectionsByClass: {},
            allDetections: []
        };
    }

    const groupedDetections = {};
    const detectionsByClass = {};

    detectionsArray.forEach(det => {
        const originalClass = (det.class || det.class_name || '').toLowerCase();
        const className = CLASS_MAPPING[originalClass] || originalClass;

        if (!groupedDetections[className]) {
            groupedDetections[className] = [];
        }

        groupedDetections[className].push({
            confidence: det.confidence,
            bbox: {
                x: det.x,
                y: det.y,
                width: det.width,
                height: det.height
            },
            originalClass: originalClass
        });
    });

    Object.keys(groupedDetections).forEach(className => {
        const items = groupedDetections[className];
        const avgConfidence =
            items.reduce((sum, item) => sum + item.confidence, 0) /
            items.length;

        detectionsByClass[className] = {
            count: items.length,
            avgConfidence,
            detections: items
        };
    });

    return {
        totalDetections: detectionsArray.length,
        detectionsByClass,
        allDetections: detectionsArray
    };
}


function validateCompletePPE(detectionsByClass) {
    const detected = Object.keys(detectionsByClass);
    const missing = EPP_CLASSES.filter(cls => !detected.includes(cls));
    
    return {
        isComplete: missing.length === 0,
        detected: detected,
        missing: missing,
        completionRate: (detected.length / EPP_CLASSES.length * 100).toFixed(2)
    };
}

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'ppe-detection-service',
        timestamp: new Date().toISOString(),
        roboflowConfigured: !!ROBOFLOW_CONFIG.apiKey
    });
});

app.post('/detect', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'No se proporcionó imagen',
                message: 'El campo "image" es requerido (base64)'
            });
        }

        const url = `${ROBOFLOW_CONFIG.apiUrl}/${ROBOFLOW_CONFIG.workspace}/workflows/${ROBOFLOW_CONFIG.workflowId}`;

        console.log(`🔍 Realizando detección EPP...`);

        const payload = {
            api_key: ROBOFLOW_CONFIG.apiKey,
            inputs: {
                image: {
                    type: "base64",
                    value: image
                }
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Roboflow API error: ${response.status} ${response.statusText} - ${txt}`);
        }

        const data = await response.json();

        const processed = processDetections(data);
        const validation = validateCompletePPE(processed.detectionsByClass);

        console.log(`✅ Detección completada: ${processed.totalDetections} elementos detectados`);

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            detections: processed.allDetections,
            summary: {
                totalDetections: processed.totalDetections,
                detectionsByClass: processed.detectionsByClass,
                validation
            },
            detection: {
                ...processed,
                validation
            },
            rawResponse: data
        });

    } catch (error) {
        console.error('Error en detección:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});


app.post('/validate', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({
                error: 'No se proporcionó imagen',
                message: 'El campo "image" es requerido (base64)'
            });
        }

        const url = `${ROBOFLOW_CONFIG.apiUrl}/${ROBOFLOW_CONFIG.workspace}/workflows/${ROBOFLOW_CONFIG.workflowId}`;
        
        console.log(`🔍 Validando EPP...`);
        
        // Preparar payload con API key incluida
        const payload = {
            api_key: ROBOFLOW_CONFIG.apiKey,
            inputs: {
                image: {
                    type: "base64",
                    value: image
                }
            }
        };
        
        // Llamar a Roboflow API
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Roboflow API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const processed = processDetections(data);
        const validation = validateCompletePPE(processed.detectionsByClass);
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            validation: {
                ...validation,
                safe: validation.isComplete,
                message: validation.isComplete 
                    ? '✅ EPP completo detectado' 
                    : `⚠️ Faltan elementos: ${validation.missing.join(', ')}`,
                detectionsByClass: processed.detectionsByClass
            }
        });
        
    } catch (error) {
        console.error('❌ Error en validación:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});


app.get('/config', (req, res) => {
    res.json({
        eppClasses: EPP_CLASSES,
        requiredElements: EPP_CLASSES.length,
        roboflowWorkspace: ROBOFLOW_CONFIG.workspace,
        roboflowWorkflowId: ROBOFLOW_CONFIG.workflowId
    });
});

app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: err.message
    });
});

app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║        🚀 MICROSERVICIO PPE DETECTION INICIADO                ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║  Puerto:              ${PORT}                                  ║`);
    console.log(`║  Entorno:             ${process.env.NODE_ENV}                  ║`);
    console.log(`║  Roboflow Workspace:  ${ROBOFLOW_CONFIG.workspace}             ║`);
    console.log('║                                                                ║');
    console.log('║  Endpoints disponibles:                                        ║');
    console.log(`║    GET  http://localhost:${PORT}/health                          ║`);
    console.log(`║    GET  http://localhost:${PORT}/config                          ║`);
    console.log(`║    POST http://localhost:${PORT}/detect                          ║`);
    console.log(`║    POST http://localhost:${PORT}/validate                        ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝');
});

module.exports = app;
