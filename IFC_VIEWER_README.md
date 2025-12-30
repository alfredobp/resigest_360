# Visor IFC/BIM - MapSig

## 🏗️ Características

Visor 3D para archivos IFC (Industry Foundation Classes) y modelos BIM integrado en MapSig.

## 📦 Instalación

Las dependencias ya están instaladas:
- `three` - Biblioteca 3D
- `web-ifc-three` - Loader de archivos IFC
- `web-ifc` - Parser de IFC

## 🎯 Uso

1. Ve a la ruta `/ifc-viewer` en tu aplicación
2. Haz click en "Cargar archivo IFC"
3. Selecciona un archivo `.ifc` de tu computadora
4. El modelo se visualizará automáticamente

## 🎮 Controles

- **Click izquierdo + arrastrar**: Rotar el modelo
- **Rueda del ratón**: Zoom in/out
- **Click derecho + arrastrar**: Mover (pan) la cámara
- **Botón "Restablecer Vista"**: Vuelve a centrar el modelo

## 📊 Información del Modelo

El visor muestra:
- Número de triángulos
- Número de vértices
- Vista en tiempo real del modelo 3D

## 🔧 Archivos WASM

Los archivos WASM necesarios se copian automáticamente a `public/wasm/` durante la instalación.

## 🌐 Ruta

Accede al visor en: `http://localhost:3000/ifc-viewer`

## ⚙️ Características Técnicas

- Renderizado con Three.js
- Iluminación ambiental y direccional
- Grid y ejes de referencia
- Controles de órbita suaves
- Carga asíncrona de archivos
- Centrado automático del modelo
- Responsive design con Tailwind CSS
- Modo oscuro/claro
